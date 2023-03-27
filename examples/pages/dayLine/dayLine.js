// pages/dayLine/dayLine.js
let flag, timer
Page({

    /**
     * 页面的初始数据
     */
    data: {
        list: [],
        stockInfo: null
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        wx.request({
            url: 'https://mock.mengxuegu.com/mock/64085d567c016026ff2b9d16/chart/kx',
            success: (res) => {
                const { dayLine } = res.data.data;
                this.setData({
                    list: dayLine
                })
            }
        })
    },

    stockInfo(res) {
        this.throttle(res)
    },

    xx(res) {
        const { data } = res.detail;
        this.setData({
            stockInfo: data
        })
    },

    clear() {
        this.setData({
            stockInfo: null
        })
    },

    throttle(data, wait = 200, immediate = true) {
        if (!flag) {
            flag = true
            // 如果是非立即执行，则在wait毫秒内的结束处执行
            timer = setTimeout(() => {
                flag = false
                this.xx(data);
            }, wait);
        }
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