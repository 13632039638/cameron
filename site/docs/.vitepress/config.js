export default {
    themeConfig: {
        siteTitle: "Cameron",
        nav: [
            { text: "指南", link: "/guild/installation/" },
            { text: "组件", link: "/components/button/" },
        ],
        socialLinks: [
            { icon: "github", link: "https://github.com/qddidi/easyest" },
        ],
        sidebar: {
            "/guild/": [
                {
                    text: "小程序图表",
                    items: [
                        {
                            text: "安装",
                            link: "/guild/init/",
                        },
                        {
                            text: "快速开始",
                            link: "/guild/quickstart",
                        },
                        {
                            text: "折线图",
                            link: "/guild/lineChart/",
                        },
                        {
                            text: "柱状图",
                            link: "/guild/columnChart/",
                        },
                        {
                            text: "分时图",
                            link: "/guild/minuteHourChart/",
                        },
                        {
                            text: "K线图",
                            link: "/guild/dayLine/",
                        },
                    ],
                },
                {
                    text: "进阶",
                    items: [
                        {
                            text: "xx",
                            link: "/xx",
                        },
                    ],
                },
            ]
        },
    },
};