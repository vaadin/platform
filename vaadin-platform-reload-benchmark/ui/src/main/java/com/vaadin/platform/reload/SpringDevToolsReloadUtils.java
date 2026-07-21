/*
 * Copyright 2000-2026 Vaadin Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.vaadin.platform.reload;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import com.vaadin.flow.component.UI;
import com.vaadin.flow.component.html.NativeButton;

public class SpringDevToolsReloadUtils {

    public static NativeButton createReloadTriggerButton() {
        NativeButton startTriggerButton = new NativeButton("Click to Start",
                event -> {
                    UI.getCurrent().getPage()
                            .executeJs("window.benchmark.start(); return true;")
                            .then(unused -> Application.triggerReload());
                });
        startTriggerButton.setId("start-button");
        return startTriggerButton;
    }

    /**
     * Runs the given reload test the requested number of times and returns the
     * <em>median</em> of the measured reload times.
     * <p>
     * The median is used instead of the arithmetic mean because this benchmark
     * exercises the full platform component set: each Spring DevTools restart
     * re-scans a large classpath and rebuilds a large frontend graph, so the
     * measurements have a systematic warm-up outlier (the first reload) and
     * occasional GC/CI spikes. The mean lets a single outlier dominate the
     * result, whereas the median reports the steady-state reload time.
     */
    public static String runAndCalculateMedianResult(
            int numberOfTimesToRunTest, Supplier<String> test) {
        var allResults = new ArrayList<BigDecimal>();
        IntStream.range(0, numberOfTimesToRunTest).forEach(index -> allResults
                .add(BigDecimal.valueOf(Double.parseDouble(test.get()))));
        System.out.printf("Test run %s times. All results: [%s]%n",
                numberOfTimesToRunTest,
                allResults.stream().map(BigDecimal::toString)
                        .collect(Collectors.joining(",")));

        List<BigDecimal> sorted = allResults.stream().sorted()
                .collect(Collectors.toList());
        int size = sorted.size();
        BigDecimal median;
        if (size % 2 == 1) {
            median = sorted.get(size / 2);
        } else {
            // Division by 2 always terminates in base 10, so no rounding needed.
            median = sorted.get(size / 2 - 1).add(sorted.get(size / 2))
                    .divide(BigDecimal.valueOf(2));
        }
        System.out.printf("Median result: %s%n", median);

        return median.toString();
    }
}
