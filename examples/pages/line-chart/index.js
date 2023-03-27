// index.js
// 获取应用实例
const app = getApp()
Page({
    data: {
        list: [],
        downList: [],
        mainList: [],
        subList: []
    },
    onLoad() {
        wx.request({
            url: 'https://mock.mengxuegu.com/mock/64085d567c016026ff2b9d16/chart/line',
            success: (res) => {
                let { list = [], downlist } = res.data.data;
                list[4].isflag = true;
                list = list.reduce((acc, item, key) => {
                    let index = (key / 10).toFixed(0);
                    acc[index] = item
                    return acc;
                }, []);
                this.setData({
                    list,
                    downList: downlist
                })
                // setInterval(() => {
                //     list.push({ value: this.getRandomInt(-20, 60) });
                //     this.setData({
                //         list
                //     })
                //     const component = this.selectComponent('#line-chart');
                //     component.clearCanvas()
                //     console.log(this.data.list)
                // }, 2000);

            }
        })
        wx.request({
            url: 'https://mock.mengxuegu.com/mock/64085d567c016026ff2b9d16/chart/lineDouble',
            success: (res) => {
                let { list = [], subList = [] } = res.data.data;

                this.setData({
                    mainList: list,
                    subList
                })


            }
        })
    },
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
})
