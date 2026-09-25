import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

/**
 * Finds dependency jars with com/vaadin classes that do not ship their own
 * META-INF/jandex.idx.
 * <p>
 * In unpack mode, the classes of those jars are copied into the given output
 * directory, so that the aggregate Jandex index built from it only covers
 * artifacts without a per-artifact index. The output directory is emptied
 * first, so it must be dedicated to this script.
 * <p>
 * In verify mode, nothing is copied and the script fails if any such jar is
 * found. This is meant to be kept as a check once all Vaadin artifacts ship
 * their own index and the aggregate index modules are removed.
 * <p>
 * Usage:
 *
 * <pre>
 * java UnpackNonIndexedJars.java &lt;outputDir&gt; &lt;classpath&gt;
 * java UnpackNonIndexedJars.java --verify &lt;classpath&gt;
 * </pre>
 */
public class UnpackNonIndexedJars {

    private static final String JANDEX_INDEX = "META-INF/jandex.idx";

    private static final String VERIFY = "--verify";

    private static final Pattern VAADIN_CLASS = Pattern
            .compile("(.*/)?com/vaadin/.*\\.class");

    public static void main(String[] args) throws IOException {
        if (args.length != 2) {
            System.err.println("""
                    Usage:
                      java UnpackNonIndexedJars.java <outputDir> <classpath>
                      java UnpackNonIndexedJars.java --verify <classpath>""");
            System.exit(1);
        }
        boolean verify = VERIFY.equals(args[0]);
        Path out = verify ? null
                : Path.of(args[0]).toAbsolutePath().normalize();
        String classpath = args[1];
        if (!verify) {
            // Drop classes from previous runs, as a dependency may have
            // started shipping its own index since then
            deleteRecursively(out);
        }

        List<String> notIndexed = new ArrayList<>();
        List<String> indexed = new ArrayList<>();
        for (String entry : classpath.split(File.pathSeparator)) {
            if (!entry.endsWith(".jar")) {
                // e.g. the module's own target/classes
                continue;
            }
            Path jar = Path.of(entry);
            try (ZipFile zip = new ZipFile(jar.toFile())) {
                List<? extends ZipEntry> classes = zip.stream()
                        .filter(e -> !e.isDirectory()
                                && VAADIN_CLASS.matcher(e.getName()).matches())
                        .toList();
                if (classes.isEmpty()) {
                    continue;
                }
                if (zip.getEntry(JANDEX_INDEX) != null) {
                    indexed.add(jar.getFileName().toString());
                    continue;
                }
                notIndexed.add(jar.getFileName().toString());
                if (!verify) {
                    copy(zip, classes, jar, out);
                }
            }
        }
        Collections.sort(notIndexed);
        Collections.sort(indexed);

        if (notIndexed.isEmpty() && indexed.isEmpty()) {
            System.out.println("""
                    [jandex] WARNING: none of the jars in the classpath contain \
                    com/vaadin classes, so there was nothing to %s.
                    [jandex] The classpath passed to the script is probably \
                    wrong. Check that the module still depends on the Vaadin \
                    artifacts (e.g. vaadin-internal), that the \
                    exec-maven-plugin execution passes the dependencies with \
                    <classpath/> and that its classpathScope includes their \
                    scope (e.g. 'compile' for 'provided' dependencies).
                    [jandex] Classpath: %s"""
                    .formatted(verify ? "verify" : "index", classpath));
            return;
        }

        System.out.println(
                "[jandex] Artifacts with their own Jandex index: " + indexed);
        if (!verify) {
            System.out.println(
                    "[jandex] Artifacts added to the aggregate index: "
                            + notIndexed);
        } else if (!notIndexed.isEmpty()) {
            System.err.println("""
                    [jandex] ERROR: the following artifacts contain com/vaadin \
                    classes but do not ship a Jandex index (%s):
                    [jandex]   %s
                    [jandex] Without an index, their classes are not visible \
                    to Jandex consumers such as Quarkus. Configure the \
                    io.smallrye:jandex-maven-plugin in the build of these \
                    artifacts, or exclude them from the dependencies of this \
                    module if they are not meant to be indexed."""
                    .formatted(JANDEX_INDEX,
                            String.join("\n[jandex]   ", notIndexed)));
            System.exit(1);
        }
    }

    private static void deleteRecursively(Path dir) throws IOException {
        if (!Files.exists(dir)) {
            return;
        }
        try (var paths = Files.walk(dir)) {
            for (Path path : paths.sorted(Comparator.reverseOrder())
                    .toList()) {
                Files.delete(path);
            }
        }
    }

    private static void copy(ZipFile zip, List<? extends ZipEntry> classes,
            Path jar, Path out) throws IOException {
        for (ZipEntry e : classes) {
            Path target = out.resolve(e.getName()).normalize();
            if (!target.startsWith(out)) {
                throw new IOException("Entry " + e.getName() + " in " + jar
                        + " points outside of " + out);
            }
            Files.createDirectories(target.getParent());
            try (InputStream in = zip.getInputStream(e)) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        }
    }
}
