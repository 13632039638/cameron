// pages/column-chart/column-chart.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        oneList: []
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        wx.request({
            url: 'https://mock.mengxuegu.com/mock/64085d567c016026ff2b9d16/chart/column',
            success: (res) => {
                const { data: { list } } = res.data;
                // list.forEach(item => {
                //     item.last_value = item.last_value.toFixed(2);
                // })
                this.setData({
                    oneList: list
                })
                console.log(list)
            }
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    }
})