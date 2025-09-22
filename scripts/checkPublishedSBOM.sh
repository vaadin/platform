#!/bin/bash

# Script to check published SBOMs for Vaadin Platform releases
# Requires:
# - curl
# - jq
# - go
# - bomber
# - osv-scanner
# - GITHUB_TOKEN environment variable set with a valid GitHub token
# For installing go, curl and jq you can use brew, choco, apt-get, depending on your OS
# For installing bomber and osv-scanner:
# - go install github.com/devops-kung-fu/bomber@latest
# - go install github.com/google/osv-scanner/cmd/osv-scanner@latest

# Function to validate date format (YYYY-MM-DD)
validate_date() {
    local date_input="$1"
    if [[ ! "$date_input" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
        echo "Error: Invalid date format. Please use YYYY-MM-DD format (e.g., 2024-01-01)" >&2
        return 1
    fi

    # Try to parse the date to ensure it's valid
    if ! date -j -f "%Y-%m-%d" "$date_input" >/dev/null 2>&1; then
        echo "Error: Invalid date. Please provide a valid date in YYYY-MM-DD format" >&2
        return 1
    fi

    return 0
}

# Function to compare dates (returns 0 if date1 >= date2, 1 otherwise)
# Uses string comparison since YYYY-MM-DD format naturally sorts correctly
date_is_greater_or_equal() {
    local date1="$1"
    local date2="$2"

    # Simple string comparison works for YYYY-MM-DD format
    if [[ "$date1" > "$date2" ]] || [[ "$date1" == "$date2" ]]; then
        return 0
    else
        return 1
    fi
}

# Function to check if a release is a GA (General Availability) release
# Returns 0 (true) if it's GA, 1 (false) if it's alpha, beta, RC, etc.
is_ga_release() {
    local tag_name="$1"

    # Check if the tag contains non-GA indicators (case insensitive)
    if [[ "$tag_name" =~ (alpha|beta|rc|snapshot|dev|pre|test) ]]; then
        return 1  # Not a GA release
    fi

    return 0  # Is a GA release
}

# Function to generate SBOM URL for a release
generate_sbom_url() {
    local tag_name="$1"
    echo "https://github.com/vaadin/platform/releases/download/${tag_name}/Software.Bill.Of.Materials.json"
}

# Function to generate SBOM file path
generate_sbom_filepath() {
    local release_date="$1"
    local tag_name="$2"
    echo "/tmp/SBOM_${release_date}_${tag_name}.json"
}

# Function to download SBOM file if not exists
download_sbom() {
    local release_date="$1"
    local tag_name="$2"
    local sbom_url="$3"
    local sbom_file
    sbom_file=$(generate_sbom_filepath "$release_date" "$tag_name")

    # Check if file already exists
    if [ -f "$sbom_file" ]; then
        echo "  SBOM already exists: $sbom_file" >&2
        return 0
    fi

    echo "  Downloading SBOM: $sbom_url" >&2

    # Download with curl, follow redirects, fail on HTTP errors
    local temp_file="${sbom_file}.tmp"
    if curl -s -L -f -o "$temp_file" "$sbom_url"; then
        # Verify it's valid JSON by checking if jq can parse it
        if jq . "$temp_file" >/dev/null 2>&1; then
            mv "$temp_file" "$sbom_file"
            echo "  SBOM saved: $sbom_file" >&2
            return 0
        else
            echo "  Error: Downloaded file is not valid JSON, removing" >&2
            rm -f "$temp_file"
            return 1
        fi
    else
        echo "  Error: Failed to download SBOM from $sbom_url" >&2
        rm -f "$temp_file"
        return 1
    fi
}

# Function to scan SBOM file with bomber if requested
scan_sbom() {
    local release_date="$1"
    local tag_name="$2"
    local scan_sbom="$3"
    local sbom_file
    sbom_file=$(generate_sbom_filepath "$release_date" "$tag_name")
    local bomber_scan_file="${sbom_file}.bomber.scan"
    local osv_scan_file="${sbom_file}.osv-scanner.scan"

    # Only scan if requested and SBOM file exists
    if [ "$scan_sbom" != "true" ] || [ ! -f "$sbom_file" ]; then
        return 0
    fi

    local scan_success=true

    # Run bomber scan
    if [ ! -f "$bomber_scan_file" ]; then
        # Check if bomber is available
        if ! command -v bomber &> /dev/null; then
            echo "  Warning: bomber command not found. Skipping bomber scan" >&2
        else
            echo "  Scanning SBOM with bomber: $sbom_file" >&2

            # Run bomber scan and save output
            if bomber scan "$sbom_file" > "$bomber_scan_file" 2>&1; then
                echo "  Bomber scan saved: $bomber_scan_file" >&2
            else
                echo "  Error: Bomber scan failed, removing incomplete scan file" >&2
                rm -f "$bomber_scan_file"
                scan_success=false
            fi
        fi
    else
        echo "  Bomber scan already exists: $bomber_scan_file" >&2
    fi

    # Run osv-scanner
    if [ ! -f "$osv_scan_file" ]; then
        # Check if osv-scanner is available (try both PATH and Go bin directory)
        local osv_cmd=""
        if command -v osv-scanner &> /dev/null; then
            osv_cmd="osv-scanner"
        elif [ -x "$HOME/go/bin/osv-scanner" ]; then
            osv_cmd="$HOME/go/bin/osv-scanner"
        else
            echo "  Warning: osv-scanner command not found. Skipping osv-scanner scan" >&2
        fi

        if [ -n "$osv_cmd" ]; then
            echo "  Scanning SBOM with osv-scanner: $sbom_file" >&2

            # Run osv-scanner and save output
            # Note: osv-scanner exits with code 1 when vulnerabilities are found, this is normal
            "$osv_cmd" --sbom="$sbom_file" > "$osv_scan_file" 2>&1
            local osv_exit_code=$?

            if [ $osv_exit_code -eq 0 ] || [ $osv_exit_code -eq 1 ]; then
                # Exit code 0 = no vulnerabilities, 1 = vulnerabilities found (both are successful scans)
                echo "  OSV-Scanner scan saved: $osv_scan_file" >&2
            else
                # Other exit codes indicate actual errors
                echo "  Error: OSV-Scanner scan failed (exit code: $osv_exit_code), removing incomplete scan file" >&2
                rm -f "$osv_scan_file"
                scan_success=false
            fi
        fi
    else
        echo "  OSV-Scanner scan already exists: $osv_scan_file" >&2
    fi

    if [ "$scan_success" = "true" ]; then
        return 0
    else
        return 1
    fi
}

# Function to get GA releases with SBOM URLs
get_ga_releases_with_sbom() {
    local min_date="$1"
    local download_sbom="$2"
    local scan_sbom="$3"
    local show_scans="$4"
    local repo="vaadin/platform"
    local api_url="https://api.github.com/repos/${repo}/releases"
    local page=1
    local per_page=100
    local all_releases=()
    local cache_file="/tmp/platform_releases_all.txt"

    # Check if GITHUB_TOKEN is set
    if [ -z "$GITHUB_TOKEN" ]; then
        echo "Error: GITHUB_TOKEN environment variable is not set" >&2
        return 1
    fi

    # Check if cache exists and if there are new releases
    if [ -f "$cache_file" ]; then
        if ! check_for_new_releases "$min_date" "$cache_file"; then
            # No new releases, use cache
            echo "Using cached releases from: $cache_file" >&2
            local cached_releases
            cached_releases=$(cat "$cache_file")

            # Filter for GA releases and apply date filter
            local ga_releases=()
            while IFS= read -r release_info; do
                if [ -n "$release_info" ]; then
                    local release_date=$(echo "$release_info" | cut -d' ' -f1)
                    local tag_name=$(echo "$release_info" | cut -d' ' -f2)

                    # Apply date filter and GA filter
                    if [ -n "$min_date" ]; then
                        if date_is_greater_or_equal "$release_date" "$min_date" && is_ga_release "$tag_name"; then
                            ga_releases+=("$release_info")
                        fi
                    else
                        if is_ga_release "$tag_name"; then
                            ga_releases+=("$release_info")
                        fi
                    fi
                fi
            done <<< "$cached_releases"

            # Output GA releases with SBOM URLs
            echo "GA Releases:" >&2
            for release_info in "${ga_releases[@]}"; do
                local release_date=$(echo "$release_info" | cut -d' ' -f1)
                local tag_name=$(echo "$release_info" | cut -d' ' -f2)
                local sbom_url=$(generate_sbom_url "$tag_name")
                echo "$release_info"
                echo "  SBOM: $sbom_url"

                # Download SBOM if requested
                if [ "$download_sbom" = "true" ]; then
                    download_sbom "$release_date" "$tag_name" "$sbom_url"
                    # Scan SBOM if requested
                    scan_sbom "$release_date" "$tag_name" "$scan_sbom"
                fi

                # Show scan results if requested
                if [ "$4" = "true" ]; then
                    show_scan_results "$release_date" "$tag_name"
                fi
            done

            echo "Total GA releases found: ${#ga_releases[@]}" >&2
            return 0
        fi
    fi

    # Fetch fresh data (either no cache exists or new releases found)
    if [ -n "$min_date" ]; then
        echo "Fetching releases from ${repo} published on or after ${min_date}..." >&2
    else
        echo "Fetching all releases from ${repo}..." >&2
    fi

    while true; do
        # Make API request with pagination
        local response
        response=$(curl -s \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            "${api_url}?page=${page}&per_page=${per_page}")

        # Check if curl command was successful
        if [ $? -ne 0 ]; then
            echo "Error: Failed to fetch releases from GitHub API" >&2
            return 1
        fi

        # Check if response is empty array (no more releases)
        if [ "$(echo "$response" | jq '. | length')" -eq 0 ]; then
            break
        fi

        # Extract release info from the response and add to array
        local page_releases
        page_releases=$(echo "$response" | jq -r '.[] | "\(.published_at | split("T")[0]) \(.tag_name)"')

        # Check if jq command was successful
        if [ $? -ne 0 ]; then
            echo "Error: Failed to parse JSON response" >&2
            return 1
        fi

        # Add releases to array (clean up any extra whitespace, store ALL releases)
        while IFS= read -r release_info; do
            # Trim whitespace
            release_info=$(echo "$release_info" | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
            if [ -n "$release_info" ]; then
                all_releases+=("$release_info")
            fi
        done <<< "$page_releases"

        # Move to next page
        ((page++))

        # Safety check to prevent infinite loop (GitHub has max 1000 pages)
        if [ $page -gt 1000 ]; then
            echo "Warning: Reached maximum page limit (1000)" >&2
            break
        fi
    done

    # Save all fetched releases to cache
    if [ ${#all_releases[@]} -gt 0 ]; then
        printf '%s\n' "${all_releases[@]}" > "$cache_file"
        echo "Cache saved to: $cache_file" >&2
    fi

    # Filter for GA releases and apply date filtering
    local ga_releases=()
    for release_info in "${all_releases[@]}"; do
        local release_date=$(echo "$release_info" | cut -d' ' -f1)
        local tag_name=$(echo "$release_info" | cut -d' ' -f2)

        # Apply date filter and GA filter
        if [ -n "$min_date" ]; then
            if date_is_greater_or_equal "$release_date" "$min_date" && is_ga_release "$tag_name"; then
                ga_releases+=("$release_info")
            fi
        else
            if is_ga_release "$tag_name"; then
                ga_releases+=("$release_info")
            fi
        fi
    done

    # Output GA releases with SBOM URLs
    echo "GA Releases:" >&2
    for release_info in "${ga_releases[@]}"; do
        local release_date=$(echo "$release_info" | cut -d' ' -f1)
        local tag_name=$(echo "$release_info" | cut -d' ' -f2)
        local sbom_url=$(generate_sbom_url "$tag_name")
        echo "$release_info"
        echo "  SBOM: $sbom_url"

        # Download SBOM if requested
        if [ "$download_sbom" = "true" ]; then
            download_sbom "$release_date" "$tag_name" "$sbom_url"
            # Scan SBOM if requested
            scan_sbom "$release_date" "$tag_name" "$scan_sbom"
        fi

        # Show scan results if requested
        if [ "$4" = "true" ]; then
            show_scan_results "$release_date" "$tag_name"
        fi
    done

    echo "Total GA releases found: ${#ga_releases[@]}" >&2
}

# Function to check for new releases in the first page
check_for_new_releases() {
    local min_date="$1"
    local cache_file="$2"
    local repo="vaadin/platform"
    local api_url="https://api.github.com/repos/${repo}/releases"

    # Check if GITHUB_TOKEN is set
    if [ -z "$GITHUB_TOKEN" ]; then
        echo "Error: GITHUB_TOKEN environment variable is not set" >&2
        return 1
    fi

    echo "Checking for new releases..." >&2

    # Get first page only
    local response
    response=$(curl -s \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "${api_url}?page=1&per_page=100")

    # Check if curl command was successful
    if [ $? -ne 0 ]; then
        echo "Error: Failed to fetch releases from GitHub API" >&2
        return 1
    fi

    # Extract release info from first page
    local first_page_releases
    first_page_releases=$(echo "$response" | jq -r '.[] | "\(.published_at | split("T")[0]) \(.tag_name)"')

    # Check if jq command was successful
    if [ $? -ne 0 ]; then
        echo "Error: Failed to parse JSON response" >&2
        return 1
    fi

    # Get the first release from cache (most recent cached release)
    local cached_first_release=""
    if [ -f "$cache_file" ]; then
        cached_first_release=$(head -n 1 "$cache_file" 2>/dev/null)
    fi

    # Get the first release from API (most recent release)
    local api_first_release=""
    api_first_release=$(echo "$first_page_releases" | head -n 1 | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

    # Compare first releases
    if [ "$cached_first_release" = "$api_first_release" ]; then
        echo "No new releases found. Using cached data." >&2
        return 1  # No new releases
    else
        echo "New releases found. Refreshing cache..." >&2
        return 0  # New releases found
    fi
}

# Function to get all releases from GitHub vaadin/platform repository
get_all_releases() {
    local min_date="$1"
    local download_sbom="$2"
    local scan_sbom="$3"
    local show_scans="$4"
    local repo="vaadin/platform"
    local api_url="https://api.github.com/repos/${repo}/releases"
    local page=1
    local per_page=100
    local all_releases=()
    local cache_file="/tmp/platform_releases_all.txt"

    # Check if GITHUB_TOKEN is set
    if [ -z "$GITHUB_TOKEN" ]; then
        echo "Error: GITHUB_TOKEN environment variable is not set" >&2
        return 1
    fi

    # Check if cache exists and if there are new releases
    if [ -f "$cache_file" ]; then
        if ! check_for_new_releases "$min_date" "$cache_file"; then
            # No new releases, use cache
            echo "Using cached releases from: $cache_file" >&2
            local cached_releases
            cached_releases=$(cat "$cache_file")

            # Apply date filter if needed
            if [ -n "$min_date" ]; then
                while IFS= read -r release_info; do
                    if [ -n "$release_info" ]; then
                        local release_date=$(echo "$release_info" | cut -d' ' -f1)
                        if date_is_greater_or_equal "$release_date" "$min_date"; then
                            all_releases+=("$release_info")
                        fi
                    fi
                done <<< "$cached_releases"

                # Output filtered results with SBOM URLs
                for release_info in "${all_releases[@]}"; do
                    local release_date=$(echo "$release_info" | cut -d' ' -f1)
                    local tag_name=$(echo "$release_info" | cut -d' ' -f2)
                    local sbom_url=$(generate_sbom_url "$tag_name")
                    echo "$release_info"
                    echo "  SBOM: $sbom_url"

                    # Download SBOM if requested
                    if [ "$download_sbom" = "true" ]; then
                        download_sbom "$release_date" "$tag_name" "$sbom_url"
                        # Scan SBOM if requested
                        scan_sbom "$release_date" "$tag_name" "$scan_sbom"
                    fi

                    # Show scan results if requested
                    if [ "$show_scans" = "true" ]; then
                        show_scan_results "$release_date" "$tag_name"
                    fi
                done
                echo "Total releases found: ${#all_releases[@]}" >&2
                return 0
            else
                # Output all cached releases with SBOM URLs
                while IFS= read -r release_info; do
                    if [ -n "$release_info" ]; then
                        local release_date=$(echo "$release_info" | cut -d' ' -f1)
                        local tag_name=$(echo "$release_info" | cut -d' ' -f2)
                        local sbom_url=$(generate_sbom_url "$tag_name")
                        echo "$release_info"
                        echo "  SBOM: $sbom_url"

                        # Download SBOM if requested
                        if [ "$download_sbom" = "true" ]; then
                            download_sbom "$release_date" "$tag_name" "$sbom_url"
                            scan_sbom "$release_date" "$tag_name" "$scan_sbom"
                        fi

                        # Show scan results if requested
                        if [ "$show_scans" = "true" ]; then
                            show_scan_results "$release_date" "$tag_name"
                        fi
                    fi
                done <<< "$cached_releases"
                local total_count=$(echo "$cached_releases" | wc -l)
                echo "Total releases found: $total_count" >&2
                return 0
            fi
        fi
    fi

    # Fetch fresh data (either no cache exists or new releases found)
    if [ -n "$min_date" ]; then
        echo "Fetching releases from ${repo} published on or after ${min_date}..." >&2
    else
        echo "Fetching all releases from ${repo}..." >&2
    fi

    while true; do
        # Make API request with pagination
        local response
        response=$(curl -s \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            "${api_url}?page=${page}&per_page=${per_page}")



        # Check if curl command was successful
        if [ $? -ne 0 ]; then
            echo "Error: Failed to fetch releases from GitHub API" >&2
            return 1
        fi

        # Check if response is empty array (no more releases)
        if [ "$(echo "$response" | jq '. | length')" -eq 0 ]; then
            break
        fi

        # Extract release info from the response and add to array
        local page_releases
        page_releases=$(echo "$response" | jq -r '.[] | "\(.published_at | split("T")[0]) \(.tag_name)"')

        # Check if jq command was successful
        if [ $? -ne 0 ]; then
            echo "Error: Failed to parse JSON response" >&2
            return 1
        fi

        # Add releases to array (clean up any extra whitespace, store ALL releases)
        while IFS= read -r release_info; do
            # Trim whitespace
            release_info=$(echo "$release_info" | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
            if [ -n "$release_info" ]; then
                all_releases+=("$release_info")
            fi
        done <<< "$page_releases"

        # Move to next page
        ((page++))

        # Safety check to prevent infinite loop (GitHub has max 1000 pages)
        if [ $page -gt 1000 ]; then
            echo "Warning: Reached maximum page limit (1000)" >&2
            break
        fi
    done

    # Save all fetched releases to cache
    local cache_file="/tmp/platform_releases_all.txt"
    if [ ${#all_releases[@]} -gt 0 ]; then
        printf '%s\n' "${all_releases[@]}" > "$cache_file"
        echo "Cache saved to: $cache_file" >&2
    fi

    # Apply date filtering for output if needed
    local filtered_releases=()
    if [ -n "$min_date" ]; then
        for release_info in "${all_releases[@]}"; do
            local release_date=$(echo "$release_info" | cut -d' ' -f1)
            if date_is_greater_or_equal "$release_date" "$min_date"; then
                filtered_releases+=("$release_info")
            fi
        done

        # Output filtered releases with SBOM URLs
        for release_info in "${filtered_releases[@]}"; do
            local release_date=$(echo "$release_info" | cut -d' ' -f1)
            local tag_name=$(echo "$release_info" | cut -d' ' -f2)
            local sbom_url=$(generate_sbom_url "$tag_name")
            echo "$release_info"
            echo "  SBOM: $sbom_url"

            # Download SBOM if requested
            if [ "$download_sbom" = "true" ]; then
                download_sbom "$release_date" "$tag_name" "$sbom_url"
                scan_sbom "$release_date" "$tag_name" "$scan_sbom"
            fi

            # Show scan results if requested
            if [ "$show_scans" = "true" ]; then
                show_scan_results "$release_date" "$tag_name"
            fi
        done
        echo "Total releases found: ${#filtered_releases[@]}" >&2
    else
        # Output all releases with SBOM URLs
        for release_info in "${all_releases[@]}"; do
            local release_date=$(echo "$release_info" | cut -d' ' -f1)
            local tag_name=$(echo "$release_info" | cut -d' ' -f2)
            local sbom_url=$(generate_sbom_url "$tag_name")
            echo "$release_info"
            echo "  SBOM: $sbom_url"

            # Download SBOM if requested
            if [ "$download_sbom" = "true" ]; then
                download_sbom "$release_date" "$tag_name" "$sbom_url"
                scan_sbom "$release_date" "$tag_name" "$scan_sbom"
            fi

            # Show scan results if requested
            if [ "$show_scans" = "true" ]; then
                show_scan_results "$release_date" "$tag_name"
            fi
        done
        echo "Total releases found: ${#all_releases[@]}" >&2
    fi
}

# Function to get latest version from each of the 4 most recent series
get_latest_series_releases() {
    local download_sbom="$1"
    local scan_sbom="$2"
    local force_latest="$3"
    local ga_only="$4"

    if [ "$ga_only" = "true" ]; then
        echo "Finding latest GA release from the 4 most recent series..." >&2
    else
        echo "Finding latest release (including pre-releases) from the 4 most recent series..." >&2
    fi

    # Since releases are sorted by date (newest first), the first occurrence of each series is the latest
    local results=()
    local seen_series=()
    local series_count=0

    while read -r date tag && [ $series_count -lt 4 ]; do
        # Apply GA filter if needed
        if [ "$ga_only" = "true" ] && ! is_ga_release "$tag"; then
            continue
        fi

        # Extract series from version
        local series
        series=$(echo "$tag" | sed -n 's/^\([0-9][0-9]*\.[0-9][0-9]*\)\.[0-9][0-9]*.*$/\1/p')

        if [ -n "$series" ]; then
            # Check if we've already seen this series
            local already_seen=false
            for seen in "${seen_series[@]}"; do
                if [ "$seen" = "$series" ]; then
                    already_seen=true
                    break
                fi
            done

            # If this is a new series, it's the latest version for that series
            if [ "$already_seen" = false ]; then
                results+=("$series $date $tag")
                seen_series+=("$series")
                ((series_count++))
            fi
        fi
    done < "/tmp/platform_releases_all.txt"

    # Sort results by series version (newest series first, then reverse to show oldest first)
    local sorted_results
    sorted_results=$(printf '%s\n' "${results[@]}" | sort -t' ' -k1,1rV | head -4 | sort -t' ' -k1,1V)

    # Output results
    echo "$sorted_results" | while read -r series_name date version; do
        local sbom_url
        sbom_url=$(generate_sbom_url "$version")

        echo "$date $version"
        echo "  SBOM: $sbom_url"

        # Download SBOM if requested
        if [ "$download_sbom" = "true" ]; then
            # Remove existing scan files if --latest flag is used
            if [ "$force_latest" = "true" ]; then
                local sbom_file
                sbom_file=$(generate_sbom_filepath "$date" "$version")
                if [ -f "${sbom_file}.bomber.scan" ]; then
                    echo "  Removing cached bomber scan file for fresh scan" >&2
                    rm -f "${sbom_file}.bomber.scan"
                fi
                if [ -f "${sbom_file}.osv-scanner.scan" ]; then
                    echo "  Removing cached osv-scanner scan file for fresh scan" >&2
                    rm -f "${sbom_file}.osv-scanner.scan"
                fi
            fi

            download_sbom "$date" "$version" "$sbom_url"
            scan_sbom "$date" "$version" "$scan_sbom"
        fi

        # Show scan results if requested
        if [ "$5" = "true" ]; then
            show_scan_results "$date" "$version"
        fi
    done
}

# Function to get specific version release
get_version_release() {
    local version_filter="$1"
    local download_sbom="$2"
    local scan_sbom="$3"
    local force_latest="$4"
    local show_scans="$5"
    local repo="vaadin/platform"
    local api_url="https://api.github.com/repos/${repo}/releases/tags/${version_filter}"

    # Check if GITHUB_TOKEN is set
    if [ -z "$GITHUB_TOKEN" ]; then
        echo "Error: GITHUB_TOKEN environment variable is not set" >&2
        return 1
    fi

    echo "Fetching release information for version ${version_filter}..." >&2

    # Make API request for specific tag
    local response
    response=$(curl -s \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        "${api_url}")

    # Check if curl command was successful
    if [ $? -ne 0 ]; then
        echo "Error: Failed to fetch release information from GitHub API" >&2
        return 1
    fi

    # Check if the release exists (API returns 404 for non-existent releases)
    local http_status
    http_status=$(echo "$response" | jq -r '.message // empty')
    if [ "$http_status" = "Not Found" ]; then
        echo "Error: Version ${version_filter} not found in repository ${repo}" >&2
        return 1
    fi

    # Extract release info from the response
    local release_info
    release_info=$(echo "$response" | jq -r '"\(.published_at | split("T")[0]) \(.tag_name)"')

    # Check if jq command was successful
    if [ $? -ne 0 ] || [ -z "$release_info" ]; then
        echo "Error: Failed to parse release information" >&2
        return 1
    fi

    # Clean up whitespace
    release_info=$(echo "$release_info" | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

    if [ -n "$release_info" ]; then
        local release_date=$(echo "$release_info" | cut -d' ' -f1)
        local tag_name=$(echo "$release_info" | cut -d' ' -f2)
        local sbom_url=$(generate_sbom_url "$tag_name")

        echo "Version ${version_filter}:" >&2
        echo "$release_info"
        echo "  SBOM: $sbom_url"

        # Download SBOM if requested
        if [ "$download_sbom" = "true" ]; then
            # Remove existing scan files if --latest flag is used
            if [ "$force_latest" = "true" ]; then
                local sbom_file
                sbom_file=$(generate_sbom_filepath "$release_date" "$tag_name")
                if [ -f "${sbom_file}.bomber.scan" ]; then
                    echo "  Removing cached bomber scan file for fresh scan" >&2
                    rm -f "${sbom_file}.bomber.scan"
                fi
                if [ -f "${sbom_file}.osv-scanner.scan" ]; then
                    echo "  Removing cached osv-scanner scan file for fresh scan" >&2
                    rm -f "${sbom_file}.osv-scanner.scan"
                fi
            fi

            download_sbom "$release_date" "$tag_name" "$sbom_url"
            scan_sbom "$release_date" "$tag_name" "$scan_sbom"

            # Display scan results for version mode if --scan was used
            if [ "$scan_sbom" = "true" ]; then
                local sbom_file
                sbom_file=$(generate_sbom_filepath "$release_date" "$tag_name")
                local bomber_scan_file="${sbom_file}.bomber.scan"
                local osv_scan_file="${sbom_file}.osv-scanner.scan"

                echo "" >&2  # Add blank line for readability
                echo "=== SCAN RESULTS ===" >&2

                # Display bomber scan results if available
                if [ -f "$bomber_scan_file" ]; then
                    echo "" >&2
                    echo "--- Bomber Scan Results ---" >&2
                    cat "$bomber_scan_file"
                fi

                # Display osv-scanner scan results if available (filter out duplicate PURL warnings)
                if [ -f "$osv_scan_file" ]; then
                    echo "" >&2
                    echo "--- OSV-Scanner Scan Results ---" >&2
                    grep -v "Warning, duplicate PURL found in SBOM:" "$osv_scan_file"
                fi
            fi
        fi

        # Show scan results if requested (regardless of whether scan was performed in this run)
        if [ "$show_scans" = "true" ]; then
            show_scan_results "$release_date" "$tag_name"
        fi

        echo "" >&2
        echo "Release found and processed." >&2
    else
        echo "Error: No release information found for version ${version_filter}" >&2
        return 1
    fi
}

# Function to display scan results for a version
show_scan_results() {
    local release_date="$1"
    local tag_name="$2"

    local sbom_file
    sbom_file=$(generate_sbom_filepath "$release_date" "$tag_name")
    local bomber_scan_file="${sbom_file}.bomber.scan"
    local osv_scan_file="${sbom_file}.osv-scanner.scan"

    echo "" >&2  # Add blank line for readability
    echo "=== SCAN RESULTS FOR $tag_name ===" >&2

    # Display bomber scan results if available
    if [ -f "$bomber_scan_file" ]; then
        echo "" >&2
        echo "--- Bomber Scan Results ---" >&2
        cat "$bomber_scan_file"
    else
        echo "" >&2
        echo "--- Bomber Scan Results ---" >&2
        echo "No bomber scan results available. Run with --scan to generate." >&2
    fi

    # Display osv-scanner scan results if available (filter out duplicate PURL warnings)
    if [ -f "$osv_scan_file" ]; then
        echo "" >&2
        echo "--- OSV-Scanner Scan Results ---" >&2
        grep -v "Warning, duplicate PURL found in SBOM:" "$osv_scan_file"
    else
        echo "" >&2
        echo "--- OSV-Scanner Scan Results ---" >&2
        echo "No osv-scanner scan results available. Run with --scan to generate." >&2
    fi

    echo "" >&2
    echo "=========================" >&2
}

# Function to check required dependencies
check_dependencies() {
    local missing_deps=()
    local optional_deps=()

    # Check required dependencies
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi

    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi

    # Check optional scanning dependencies
    if ! command -v bomber &> /dev/null; then
        optional_deps+=("bomber")
    fi

    # Check for osv-scanner in PATH and Go bin directory
    if ! command -v osv-scanner &> /dev/null && [ ! -x "$HOME/go/bin/osv-scanner" ]; then
        optional_deps+=("osv-scanner")
    fi

    # Exit if required dependencies are missing
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo "Error: Required dependencies are missing:" >&2
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep" >&2
        done
        echo "" >&2
        echo "Please install the missing dependencies:" >&2
        echo "  - curl: Usually available by default or via package manager" >&2
        echo "  - jq: Install via package manager (brew install jq, apt install jq, etc.)" >&2
        exit 1
    fi

    # Warn about optional dependencies only when scanning is requested
    if [ "$1" = "scan" ] && [ ${#optional_deps[@]} -gt 0 ]; then
        echo "Warning: Optional scanning dependencies are missing:" >&2
        for dep in "${optional_deps[@]}"; do
            echo "  - $dep" >&2
        done
        echo "" >&2
        echo "Install scanning tools for full functionality:" >&2
        echo "  - bomber: go install github.com/devops-kung-fu/bomber@latest" >&2
        echo "  - osv-scanner: go install github.com/google/osv-scanner/cmd/osv-scanner@v1" >&2
        echo "" >&2
        echo "Continuing with available scanners..." >&2
    fi
}

# Main script execution
main() {
    local date_filter=""
    local version_filter=""
    local mode="all"
    local download_sbom="false"
    local scan_sbom="false"
    local force_latest="false"
    local show_scans="false"

    # Check for required dependencies first
    check_dependencies

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --ga|--ga-releases)
                mode="ga"
                shift
                ;;
            --download|-d)
                download_sbom="true"
                shift
                ;;
            --scan|-s)
                scan_sbom="true"
                download_sbom="true"  # Scanning requires downloading
                shift
                ;;
            --show)
                show_scans="true"
                shift
                ;;
            --version)
                if [ -z "$2" ]; then
                    echo "Error: --version requires a version number (e.g., --version 24.7.0)" >&2
                    exit 1
                fi
                version_filter="$2"
                shift 2
                ;;
            --latest)
                force_latest="true"
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS] [YYYY-MM-DD]"
                echo "Options:"
                echo "  --ga, --ga-releases    Show only GA releases (excludes alpha/beta/RC)"
                echo "  --download, -d         Download SBOM files to /tmp/SBOM_DATE_VERSION.json"
                echo "  --scan, -s             Download and scan SBOM files with bomber and osv-scanner"
                echo "  --show                 Display scan results for filtered versions (requires existing scan files)"
                echo "  --version VERSION      Test specific version only (e.g., --version 24.7.0)"
                echo "  --latest               When used with --version: force fresh scans by discarding cached scan files"
                echo "                         When used alone: show latest version from the 4 most recent release series"
                echo "                         (combine with --ga to show only GA versions from those series)"
                echo "  --help, -h            Show this help message"
                echo ""
                echo "All releases include SBOM URLs in the format:"
                echo "https://github.com/vaadin/platform/releases/download/{tag}/Software.Bill.Of.Materials.json"
                echo ""
                echo "Scanning creates two files for each SBOM:"
                echo "  - file.bomber.scan (bomber vulnerability scanner output)"
                echo "  - file.osv-scanner.scan (OSV vulnerability scanner output)"
                echo ""
                echo "Examples:"
                echo "  $0                          # Show all releases with SBOM URLs"
                echo "  $0 2024-01-01              # Show releases from 2024-01-01 onwards with SBOM URLs"
                echo "  $0 --ga 2025-09-01         # Show only GA releases from 2025-09-01 with SBOM URLs"
                echo "  $0 --download --ga 2025-09-01  # Download GA SBOM files from 2025-09-01"
                echo "  $0 --scan --ga 2025-09-01     # Download and scan GA SBOM files with both scanners"
                echo "  $0 --version 24.7.0 --scan     # Test specific version 24.7.0 and scan it"
                echo "  $0 --version 24.7.0 --scan --latest  # Force fresh scan of version 24.7.0"
                echo "  $0 --latest                        # Show latest version from the 4 most recent series (includes pre-releases)"
                echo "  $0 --latest --ga                   # Show latest GA version from the 4 most recent series"
                echo "  $0 --latest --show                 # Show latest versions and their scan results"
                echo "  $0 --ga 2025-09-01 --show         # Show GA releases from date and their scan results"
                exit 0
                ;;
            *)
                if [ -z "$date_filter" ]; then
                    date_filter="$1"

                    # Validate the date format
                    if ! validate_date "$date_filter"; then
                        echo "Usage: $0 [OPTIONS] [YYYY-MM-DD]" >&2
                        echo "Use --help for more information" >&2
                        exit 1
                    fi
                else
                    echo "Error: Unexpected argument '$1'" >&2
                    echo "Use --help for usage information" >&2
                    exit 1
                fi
                shift
                ;;
        esac
    done

    # Validate that version filter and date filter are not used together
    if [ -n "$version_filter" ] && [ -n "$date_filter" ]; then
        echo "Error: Cannot use both --version and date filter together" >&2
        echo "Use --help for usage information" >&2
        exit 1
    fi



    # Check scanning dependencies if scan mode is requested
    if [ "$scan_sbom" = "true" ]; then
        check_dependencies "scan"
    fi

    # Get releases based on mode
    if [ -n "$version_filter" ]; then
        # Version-specific mode
        get_version_release "$version_filter" "$download_sbom" "$scan_sbom" "$force_latest" "$show_scans"
    elif [ "$force_latest" = "true" ]; then
        # Latest series mode (4 most recent series)
        local ga_only="false"
        if [ "$mode" = "ga" ]; then
            ga_only="true"
        fi
        get_latest_series_releases "$download_sbom" "$scan_sbom" "$force_latest" "$ga_only" "$show_scans"
    elif [ "$mode" = "ga" ]; then
        get_ga_releases_with_sbom "$date_filter" "$download_sbom" "$scan_sbom" "$show_scans"
    else
        get_all_releases "$date_filter" "$download_sbom" "$scan_sbom" "$show_scans"
    fi
}

# Check if script is being executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi