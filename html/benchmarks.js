"use strict";

// Copyright (c) 2019 Maxim Egorushkin. MIT License. See the full licence in file LICENSE.

$(function() {
    const settings = {
     "boost::lockfree::spsc_queue": ['#8E44AD',  0],
          "boost::lockfree::queue": ['#AA73C2',  1],
     "moodycamel::ConcurrentQueue": ['#E74C3C',  2],
                "pthread_spinlock": ['#58D68D',  3],
                 "tbb::spin_mutex": ['#3498DB',  4],
     "tbb::speculative_spin_mutex": ['#67B2E4',  5],
   "tbb::concurrent_bounded_queue": ['#9ACCED',  6],
                     "AtomicQueue": ['#FFFF00',  7],
                    "AtomicQueueB": ['#FFFF40',  8],
                    "AtomicQueue2": ['#FFFF80',  9],
                   "AtomicQueueB2": ['#FFFFBF', 10],
             "OptimistAtomicQueue": ['#FF0000', 11],
            "OptimistAtomicQueueB": ['#FF4040', 12],
            "OptimistAtomicQueue2": ['#FF8080', 13],
           "OptimistAtomicQueueB2": ['#FFBFBF', 14],
    };

    function scalability_to_series(results) {
        return Array.from(Object.entries(results)).map(entry => {
            const name = entry[0];
            const s = settings[name];
            return {
                name: name,
                color: s[0],
                index: s[1],
                data: Array.from(Object.entries(entry[1])).map(xy => { return [parseInt(xy[0]), xy[1]]; })
            };
        });
    }

    function latency_to_series(results) {
        results = results["sec/round-trip"];
        const series = Array.from(Object.entries(results)).map(entry => {
            const name = entry[0];
            const value = entry[1];
            const s = settings[name];
            return {
                name: name,
                color: s[0],
                index: s[1],
                data: [{y: Math.round(value * 1e9), x: s[1]}]
            };
        });
        const categories = series
              .slice()
              .sort((a, b) => { return a.index - b.index; })
              .map(s => { return s.name; })
              ;
        return [series, categories];
    }

    function plot_scalability(div_id, series, title_suffix) {
        Highcharts.chart(div_id, {
            chart: { type: 'column' },
            title: { text: 'Scalability on ' + title_suffix },
            xAxis: {
                title: { text: 'number of producers, number of consumers' },
                tickInterval: 1
            },
            yAxis: { title: { text: 'throughput, msg/sec' } },
            tooltip: {
                followPointer: true,
                useHTML: true,
                shared: true,
                headerFormat: '<span style="font-weight: bold; font-size: 1.2em;">{point.key} producers, {point.key} consumers</span><table>',
                pointFormat: '<tr><td style="color: {series.color}">{series.name}: </td>' +'<td style="text-align: right"><b>{point.y} msg/sec</b></td></tr>',
                footerFormat: '</table>'
            },
            series: series
        });
    }

    function plot_latency(div_id, series_categories, title_suffix) {
        const [series, categories] = series_categories;
        Highcharts.chart(div_id, {
            chart: { type: 'bar' },
            plotOptions: {
                series: { stacking: 'normal' },
                bar: { dataLabels: { enabled: true, align: 'left', inside: false } }
            },
            title: { text: 'Latency on ' + title_suffix },
            xAxis: { categories: categories },
            yAxis: { title: { text: 'letency, nanoseconds/round-trip' }, max: 700 },
            tooltip: { valueSuffix: ' nanoseconds' },
            series: series
        });
    }

    // TODO: load these from files.
    const scalability_7700k = {"AtomicQueue":{"1":53844566.0,"2":23281702.0,"3":16890888.0,"4":12962541.0},"AtomicQueue2":{"1":52345350.0,"2":21788334.0,"3":15748689.0,"4":13090657.0},"AtomicQueueB":{"1":48627732.0,"2":16494010.0,"3":14684914.0,"4":12182562.0},"AtomicQueueB2":{"1":38722321.0,"2":13895007.0,"3":13492658.0,"4":11553318.0},"OptimistAtomicQueue":{"1":85508308.0,"2":88483646.0,"3":60957421.0,"4":49866071.0},"OptimistAtomicQueue2":{"1":56233830.0,"2":40487773.0,"3":48918577.0,"4":51574797.0},"OptimistAtomicQueueB":{"1":56239944.0,"2":33552904.0,"3":30289223.0,"4":32108204.0},"OptimistAtomicQueueB2":{"1":41415767.0,"2":17767914.0,"3":19676804.0,"4":23313561.0},"boost::lockfree::queue":{"1":31904998.0,"2":9879410.0,"3":8728706.0,"4":7779936.0},"boost::lockfree::spsc_queue":{"1":220864954.0,"2":null,"3":null,"4":null},"moodycamel::ConcurrentQueue":{"1":46873769.0,"2":14592499.0,"3":16137937.0,"4":20287570.0},"pthread_spinlock":{"1":61725934.0,"2":23802362.0,"3":17410361.0,"4":16004742.0},"tbb::concurrent_bounded_queue":{"1":35499289.0,"2":16703571.0,"3":14688115.0,"4":12289227.0},"tbb::speculative_spin_mutex":{"1":64910411.0,"2":48378648.0,"3":35360632.0,"4":28225301.0},"tbb::spin_mutex":{"1":75111106.0,"2":46954194.0,"3":36556835.0,"4":32085543.0}};
        const scalability_xeon_gold_6132 = {"AtomicQueue":{"1":9696137.0,"2":5113503.0,"3":4141451.0,"4":3274174.0,"5":2764226.0,"6":2621442.0,"7":2374290.0,"8":2074648.0,"9":1740752.0,"10":1680176.0,"11":1266255.0,"12":1301882.0,"13":1180727.0,"14":1018679.0},"AtomicQueue2":{"1":9543276.0,"2":4854596.0,"3":3462681.0,"4":3264564.0,"5":3085452.0,"6":2623979.0,"7":2440928.0,"8":1969282.0,"9":2067866.0,"10":1439977.0,"11":1451288.0,"12":1251340.0,"13":1239156.0,"14":1043533.0},"AtomicQueueB":{"1":7099996.0,"2":3863278.0,"3":3422980.0,"4":2759555.0,"5":2759993.0,"6":2420037.0,"7":2291867.0,"8":1968604.0,"9":1731075.0,"10":1493406.0,"11":1359039.0,"12":1317993.0,"13":1067244.0,"14":1046549.0},"AtomicQueueB2":{"1":6988190.0,"2":3302594.0,"3":3012039.0,"4":2907121.0,"5":2491547.0,"6":2494362.0,"7":2270345.0,"8":1650423.0,"9":1482663.0,"10":1365432.0,"11":1165151.0,"12":1141469.0,"13":1065792.0,"14":963764.0},"OptimistAtomicQueue":{"1":81831134.0,"2":16152487.0,"3":19305269.0,"4":20759488.0,"5":20739326.0,"6":21214473.0,"7":20991129.0,"8":17339321.0,"9":16632880.0,"10":15421095.0,"11":15644911.0,"12":16394707.0,"13":17797921.0,"14":17720380.0},"OptimistAtomicQueue2":{"1":35186202.0,"2":12779365.0,"3":12999333.0,"4":16204496.0,"5":18236302.0,"6":18838059.0,"7":19357689.0,"8":15577084.0,"9":14317552.0,"10":14576662.0,"11":16404733.0,"12":16641030.0,"13":17960886.0,"14":16513440.0},"OptimistAtomicQueueB":{"1":19695193.0,"2":9883056.0,"3":9430064.0,"4":9540612.0,"5":9294718.0,"6":9312776.0,"7":9460386.0,"8":6888133.0,"9":6859389.0,"10":6775933.0,"11":6621629.0,"12":6649624.0,"13":6562642.0,"14":6657301.0},"OptimistAtomicQueueB2":{"1":5101777.0,"2":5219694.0,"3":5381000.0,"4":5746432.0,"5":5448104.0,"6":5428535.0,"7":5800417.0,"8":4082880.0,"9":3811106.0,"10":4145168.0,"11":4003235.0,"12":4292655.0,"13":4302508.0,"14":4169805.0},"boost::lockfree::queue":{"1":3521690.0,"2":2562428.0,"3":2348623.0,"4":2238333.0,"5":2049650.0,"6":1950615.0,"7":1864150.0,"8":1458324.0,"9":1301970.0,"10":1299679.0,"11":1071609.0,"12":1052382.0,"13":954405.0,"14":987648.0},"boost::lockfree::spsc_queue":{"1":144666459.0,"2":null,"3":null,"4":null,"5":null,"6":null,"7":null,"8":null,"9":null,"10":null,"11":null,"12":null,"13":null,"14":null},"moodycamel::ConcurrentQueue":{"1":7573048.0,"2":5541480.0,"3":5522689.0,"4":5405631.0,"5":5290852.0,"6":5156818.0,"7":4858903.0,"8":3603812.0,"9":3349858.0,"10":3225625.0,"11":3144155.0,"12":3153005.0,"13":3161092.0,"14":3051706.0},"pthread_spinlock":{"1":9659681.0,"2":4657558.0,"3":3825858.0,"4":3435737.0,"5":2733183.0,"6":2499775.0,"7":2291912.0,"8":1293929.0,"9":1363922.0,"10":1095693.0,"11":1099973.0,"12":1008937.0,"13":990426.0,"14":899041.0},"tbb::concurrent_bounded_queue":{"1":6974499.0,"2":5100105.0,"3":3976250.0,"4":3498672.0,"5":3025518.0,"6":2663694.0,"7":2384737.0,"8":1889815.0,"9":1645467.0,"10":1519671.0,"11":1265689.0,"12":1285066.0,"13":1086783.0,"14":990610.0},"tbb::speculative_spin_mutex":{"1":24056628.0,"2":15233181.0,"3":12222476.0,"4":7104463.0,"5":5793429.0,"6":4736784.0,"7":3985820.0,"8":2679832.0,"9":1992734.0,"10":1607595.0,"11":1466988.0,"12":1475286.0,"13":1308450.0,"14":1137199.0},"tbb::spin_mutex":{"1":31240517.0,"2":18056647.0,"3":10496882.0,"4":8055552.0,"5":6200532.0,"6":4592549.0,"7":3021025.0,"8":2008397.0,"9":1324593.0,"10":1104099.0,"11":838783.0,"12":708963.0,"13":675509.0,"14":591115.0}};
    const latency_7700k = {"sec/round-trip":{"AtomicQueue":0.000000146,"AtomicQueue2":0.000000175,"AtomicQueueB":0.000000163,"AtomicQueueB2":0.000000234,"OptimistAtomicQueue":0.000000086,"OptimistAtomicQueue2":0.000000124,"OptimistAtomicQueueB":0.000000123,"OptimistAtomicQueueB2":0.000000196,"boost::lockfree::queue":0.000000259,"boost::lockfree::spsc_queue":0.000000118,"moodycamel::ConcurrentQueue":0.000000193,"pthread_spinlock":0.000000243,"tbb::concurrent_bounded_queue":0.000000249,"tbb::speculative_spin_mutex":0.000000242,"tbb::spin_mutex":0.000000172}};
    const latency_xeon_gold_6132 = {"sec/round-trip":{"AtomicQueue":0.000000339,"AtomicQueue2":0.000000361,"AtomicQueueB":0.000000384,"AtomicQueueB2":0.000000424,"OptimistAtomicQueue":0.000000202,"OptimistAtomicQueue2":0.000000214,"OptimistAtomicQueueB":0.000000285,"OptimistAtomicQueueB2":0.000000408,"boost::lockfree::queue":0.000000691,"boost::lockfree::spsc_queue":0.000000282,"moodycamel::ConcurrentQueue":0.000000437,"pthread_spinlock":0.000000324,"tbb::concurrent_bounded_queue":0.000000597,"tbb::speculative_spin_mutex":0.000000581,"tbb::spin_mutex":0.000000277}};

    plot_scalability('scalability-7700k-5GHz', scalability_to_series(scalability_7700k), "Intel i7-7700k (core 5GHz / uncore 4.7GHz)");
    plot_scalability('scalability-xeon-gold-6132', scalability_to_series(scalability_xeon_gold_6132), "Intel Xeon Gold 6132 (stock)");
    plot_latency('latency-7700k-5GHz', latency_to_series(latency_7700k), "Intel i7-7700k (core 5GHz / uncore 4.7GHz)");
    plot_latency('latency-xeon-gold-6132', latency_to_series(latency_xeon_gold_6132), "Intel Xeon Gold 6132 (stock)");
});
