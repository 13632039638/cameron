// pages/minute-hour-chart/minute-hour-chart.js
Page({

    data: {
        list: [],
        base_info: {}
    },

    onLoad(options) {
        wx.request({
            url: 'https://mock.mengxuegu.com/mock/62f719a8f2652f239bd0a7d1/ds/minuteLine',
            success: (res) => {
                let { data: { base_info, minuteLine } } = res.data;
                // minuteLine = minuteLine.slice(0, 80)
                minuteLine.forEach(item => {
                    item[0] = item[0].slice(0, 2).concat(`:${item[0].slice(2)}`)
                })
                this.setData({
                    list: minuteLine,
                    base_info
                });

                //     component.clearCanvas()
                // setInterval(() => {
                //     if (!this.component) {
                //         this.component = this.selectComponent('#minuteHour');
                //     }
                //     minuteLine.push(minuteLine[this.getRandomIndex(minuteLine)]);
                //     this.setData({
                //         list: minuteLine
                //     })
                //     this.component.clearCanvas();
                // }, 3000);
            }
        })
    },
    getRandomIndex(arr) {
        const randomIndex = Math.floor(Math.random() * arr.length);
        return randomIndex;
    }
})