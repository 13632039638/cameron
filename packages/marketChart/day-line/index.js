Component({
    properties: {
        canvasId: {
            type: String,
            value: ''
        },
        width: {
            type: Number,
            value: 706
        },
        list: {
            type: Array,
            value: []
        },
        base_info: {
            type: Object,
            value: {}
        },
        // 折线图高度
        topHight: {
            type: Number,
            value: 404
        },
        // 成交量高度
        botHight: {
            type: Number,
            value: 185
        },
        // 中间间隙高度
        space: {
            type: Number,
            value: 40
        },
        mineLineNum: {
            type: Number,
            value: 4
        },
        // 竖向分隔线
        verticalLineNum: {
            type: Number,
            value: 4
        },
        // 网格背景线宽度
        gridWidth: {
            type: Number,
            value: 1
        },
        // 均线颜色
        averageColor: {
            type: String,
            value: '#FF8300'
        },
        gridColor: {
            type: String,
            value: '#F4F5F6'
        },
        textColor: {
            type: String,
            value: '#909399'
        },
        upColor: {
            type: String,
            value: '#FE5269'
        },
        downColor: {
            type: String,
            value: '#02BD85'
        },
        flatColor: {
            type: String,
            value: '#606266'
        },
        fiveDayColor: {
            type: String,
            value: '#FF8300'
        },
        tenDayColor: {
            type: String,
            value: '#1988F4'
        },
        twentyDayColor: {
            type: String,
            value: '#880EF5'
        },
        thirtyColor: {
            type: String,
            value: '#56B8FF'
        },
        sixtyColor: {
            type: String,
            value: '#8694AA'
        },
        // 十字架颜色
        crossColor: {
            type: String,
            value: '#303133'
        },
        // 边距
        ml: {
            type: Number,
            value: 0
        },
        mt: {
            type: Number,
            value: 0
        },
        mr: {
            type: Number,
            value: 0
        },
        mb: {
            type: Number,
            value: 0
        }
    },
    attached() {
        this.maxVal = 0;
        this.minVal = 0;
        this.tMaxVal = 0;
        this.tMinVal = 0;
        this.startIndex = 0;        // 开始下标
        this.visibleNum = 60;         // 可视条数
        this.timeInfo = {};         // 存储日期坐标
        this.isDragging = true;       // 是否能滚动
        this.touchstartX = 0;       // 起始拖动x轴
        this.moveX = 0;             // 移动拖动x轴
        this.moveLastTime = 0;
        this.init();
    },
    methods: {
        init() {
            let max = 3
            let current = 0
            const { canvasId = '' } = this.data;
            if (!canvasId) return false;
            const setCanvas = () => {
                const query = wx.createSelectorQuery().in(this);
                query
                    .select('#' + canvasId)
                    .fields({ node: true, size: true })
                    .exec(async (res) => {
                        if (!res[0]) {
                            current++
                            if (current < max) {
                                setCanvas()
                            }
                            else {
                                console.warn('无法获取canvas')
                            }
                            return
                        }
                        this.node = res[0];
                        let canvas = res[0].node;
                        // 获取屏幕分辨率
                        const { devicePixelRatio = 0, screenWidth } = await wx.getSystemInfo();
                        this.screenWidth = screenWidth;
                        canvas.width = res[0].width * devicePixelRatio;
                        canvas.height = res[0].height * devicePixelRatio;
                        this.ctx = canvas.getContext('2d');
                        this.ctx.transform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
                        this.startIndex = this.data.list.length - this.visibleNum;
                        this.startDraw();

                        query
                            .select(`#touchMove`)
                            .fields({ node: true, size: true })
                            .exec((res) => {
                                let canvas2 = res[1].node
                                canvas2.width = res[1].width * devicePixelRatio;
                                canvas2.height = res[1].height * devicePixelRatio;
                                this.ctx2 = canvas2.getContext('2d');
                                this.canvas2 = canvas2;
                                this.ctx2.transform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
                            });
                    })
            }
            setCanvas();
        },
        startDraw() {
            // 绘制分时网格
            this.drawMineGrid();
            // 绘制成交量网格
            this.drawVolumeGrid();
            // 绘制网格竖线
            this.verticalLine();
            // 计算涨幅
            this.computedMark();
            // 计算x轴刻度
            this.markX();
            // 绘制侧边刻度
            this.draw_label();
            // 绘制日k矩形
            this.drawDayRect();
            // 绘制最高最低点
            // this.drawMaxMinPoint();
            // 绘制5日均线
            this.drawAverage(6, this.data.fiveDayColor);
            // 绘制10日均线
            this.drawAverage(7, this.data.tenDayColor);
            // 绘制20日均线
            this.drawAverage(8, this.data.twentyDayColor);
            // 绘制30日均线
            this.drawAverage(9, this.data.thirtyColor);
            // 绘制60日均线
            this.drawAverage(10, this.data.sixtyColor);
            // 绘制成交量
            this.drawTurnover();
        },
        drawTurnover() {
            const { ctx, xScale, tMaxVal, tMinVal, startIndex, visibleNum, node: { width } } = this;
            let { list, botHight, topHight, space, upColor, downColor, textColor } = this.ConvertQuery();
            let maxTurnover = [];
            list = list.slice(startIndex, startIndex + visibleNum);
            let yScale = this.markY({
                height: botHight,
                maxVal: tMaxVal,
                minVal: tMinVal
            });
            ctx.save();
            ctx.lineWidth = 1;
            for (let i = 0; i < list.length; i++) {
                let x = i * xScale,
                    y = (topHight + space) + (tMaxVal - list[i][5]) * yScale,
                    w = (xScale - 0.8);
                maxTurnover.push(list[i][14].replace(/万/, ''));
                ctx.fillStyle = list[i][2] < list[i][1] ? downColor : upColor;
                ctx.beginPath();
                ctx.rect(x, y, w, list[i][5] * yScale);
                ctx.fill();
                // 收集日期x轴
                if (['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'].includes(list[i][0].slice(list[i][0].length - 2))) {
                    this.timeInfo[list[i][0].slice(0, list[i][0].length - 3)] = { x }
                }
            }
            const text = `${Math.max(...maxTurnover)}万`;
            ctx.fillStyle = "#909399";
            ctx.fillText(text, width - ctx.measureText(text).width - 4, topHight + space + 14);
            ctx.restore();
            // 绘制日期
            ctx.save();
            ctx.fillStyle = textColor;
            for (let key in this.timeInfo) {
                ctx.fillText(key, this.timeInfo[key].x, topHight + space + botHight + 10);
            }
            ctx.restore();
        },
        drawAverage(index, color) {
            if (!color) return false;
            const { ctx, xScale, maxVal, minVal, startIndex, visibleNum } = this;
            let { list, topHight } = this.ConvertQuery();
            list = list.slice(startIndex, startIndex + visibleNum);
            const yScale = this.markY({
                height: topHight,
                maxVal,
                minVal
            });
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < list.length; i++) {
                let x = i * xScale,
                    y = (maxVal - list[i][index]) * yScale;
                if (i == 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            ctx.restore();
        },
        drawMaxMinPoint() {
            let { list, topHight, upColor, downColor } = this.ConvertQuery();
            const { ctx, maxVal, minVal, xScale, startIndex, visibleNum, } = this;
            list = list.slice(startIndex, startIndex + visibleNum);
            const yScale = this.markY({
                height: topHight,
                maxVal,
                minVal
            });
            let currentMaxVal = maxVal - 0.6,
                currentMinVal = Number(minVal) + 0.6,
                maxIndex = list.findIndex((item, index) => item[4] == currentMaxVal),
                minIndex = list.findIndex((item, index) => item[3] == currentMinVal),
                maxValx = maxIndex * xScale,
                maxValy = (maxVal - currentMaxVal) * yScale,
                minValx = minIndex * xScale,
                minValy = (maxVal - currentMinVal) * yScale;
            this.drawText(currentMaxVal, maxValx, maxValy);
            this.drawText(currentMinVal, minValx, minValy);
            console.log(minValx, minValy)
        },
        drawText(textVal, x, y) {
            const { ctx, node: { width } } = this;
            const textWidth = ctx.measureText(textVal).width;
            let endX = 0,       // 线条x轴
                textX = 0;      // 文字x轴
            ctx.save();
            // 超出屏幕右边
            if (x + textWidth > width) {
                endX = x - 15;
                textX = endX - textWidth - 3;
            } else {
                endX = x + 15;
                textX = endX + 3;
                // console.log('右边')
            }
            ctx.strokeStyle = '#000000';
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(endX, y);
            ctx.fillText(textVal, textX, y)
            ctx.stroke();
            ctx.arc(endX, y, 2, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.restore();
        },
        drawDayRect() {
            let { list, topHight, upColor, downColor } = this.ConvertQuery();
            const { ctx, maxVal, minVal, xScale, startIndex, visibleNum } = this;
            list = list.slice(startIndex, startIndex + visibleNum);
            const yScale = this.markY({
                height: topHight,
                maxVal,
                minVal
            });
            for (let i = 0; i < list.length; i++) {
                let barX = i * xScale,		// 柱状x坐标
                    barY = 0,				// 柱状y坐标
                    barW = (xScale - 0.8),  // 柱状宽度
                    lineY = 0,				// 影线y坐标
                    collect = 0,			// 存储计算柱状高度数据
                    barH = 0,				// 柱状高度
                    lineH = 0;				// 影线高度
                // 收盘 < 开盘 = 绿色
                if (list[i][2] < list[i][1]) {
                    // 如果当天是跌的则从开盘开始往下绘制
                    barY = (maxVal - list[i][1]) * yScale;
                    collect = (maxVal - list[i][2]) * yScale;
                } else {
                    // 如果当天是涨的则从收盘开始往下绘制
                    barY = (maxVal - list[i][2]) * yScale;
                    collect = (maxVal - list[i][1]) * yScale;
                }
                // 计算影线长度
                lineY = (maxVal - list[i][4]) * yScale;
                lineH = Math.abs(lineY - (maxVal - list[i][3]) * yScale);

                // 如果柱体小于1 则默认为1不然会绘制不出柱体
                barH = Math.abs(barY - collect) < 0.5 ? 1 : Math.abs(barY - collect);
                ctx.beginPath();
                ctx.fillStyle = list[i][2] < list[i][1] ? downColor : upColor;
                // 开盘 - 收盘的绝对值就是柱体高度
                ctx.rect(barX, barY, barW, barH);
                // 绘制影线
                ctx.rect((barX - 0.8) + (barW / 2) + 0.25, lineY, 1, lineH);
                ctx.fill();
            }
        },
        draw_label() {
            const labelNum = 5;
            const { ml, mt, topHight } = this.ConvertQuery();
            const { ctx, maxVal, minVal, node: { width } } = this;
            const yScale = this.markY({ height: topHight, maxVal, minVal });
            const diff = (maxVal - minVal) / (labelNum - 1);
            ctx.textBaseline = "middle";
            ctx.strokeStyle = '#F4F5F6';
            ctx.fillStyle = "#303133";
            for (let i = 0; i < labelNum; i++) {
                let text = maxVal - i * diff,
                    x = ml,
                    y = mt + yScale * (maxVal - text);
                if (i == 0) y += 6
                if (i == labelNum - 1) y -= 6;
                ctx.fillText(text.toFixed(2), x, y);
            }
        },
        markX() {
            this.xScale = this.node.width / this.visibleNum;
        },
        markY({ height, maxVal, minVal }) {
            return height / (maxVal - minVal);
        },
        computedMark() {
            let { list } = this.data;
            list = list.slice(this.startIndex, this.startIndex + this.visibleNum);
            let maxVal = [],
                minVal = [],
                turnover = [];
            maxVal = list.reduce((acc, cItem) => {
                acc.push(cItem[4]);
                minVal.push(cItem[3]);
                turnover.push(cItem[5]);
                return acc;
            }, []);
            this.maxVal = this.toFixed(Math.max(...maxVal) + 0.6);
            this.minVal = this.toFixed(Math.min(...minVal) - 0.6);
            this.tMaxVal = Math.max(...turnover);
            this.tMinVal = Math.min(...turnover);
            if (this.tMinVal > 0) this.tMinVal = 0;
            if (this.tMaxVal < 0 && this.tMinVal < 0) this.tMaxVal = 0;
        },
        verticalLine() {
            const { ctx } = this;
            let { topHight, botHight, gridWidth, gridColor, space, verticalLineNum, mb } = this.ConvertQuery();
            const { width } = this.node;
            let xScale = width / verticalLineNum;
            ctx.save();
            ctx.lineWidth = gridWidth;
            ctx.strokeStyle = gridColor;
            for (let i = 0; i < verticalLineNum; i++) {
                this.drawLine(i * xScale, 0, i * xScale, topHight);
                this.drawLine(i * xScale, topHight + space, i * xScale, topHight + space + botHight);
            }
            this.drawLine(width - 1, 0, width - 1, topHight);
            this.drawLine(width - 1, topHight + space, width - 1, topHight + space + botHight);
            ctx.restore();
        },
        drawVolumeGrid() {
            const { ctx } = this;
            let { topHight, botHight, gridWidth, gridColor, space, mb } = this.ConvertQuery();
            const { width } = this.node;
            this.botScale = botHight / 2;
            ctx.save();
            ctx.lineWidth = gridWidth;
            ctx.strokeStyle = gridColor;
            let hight = topHight + space;
            this.drawLine(0, hight + this.botScale, width, hight + this.botScale);
            this.drawLine(0, hight, width, hight);
            this.drawLine(0, hight + botHight - 1, width, hight + botHight - 1);
        },
        drawMineGrid() {
            const { ctx } = this;
            const { mineLineNum, topHight, gridWidth, gridColor } = this.data;
            const { width } = this.node;
            this.topScale = this.Convert(topHight) / mineLineNum;
            ctx.save();
            ctx.lineWidth = gridWidth;
            ctx.strokeStyle = gridColor;
            for (let i = 1; i <= mineLineNum; i++) {
                this.drawLine(0, i * this.topScale, width, i * this.topScale);
            }
            this.drawLine(0, 1, width, 1);
            ctx.restore();
        },
        ConvertQuery() {
            const obj = JSON.parse(JSON.stringify(this.data));
            // rpx转换px
            obj.topHight = this.Convert(obj.topHight);
            obj.space = this.Convert(obj.space);
            obj.mb = this.Convert(obj.mb);
            // 减mb是为了底部流出一点距离
            obj.botHight = this.Convert(obj.botHight - obj.mb);
            return obj;
        },
        Convert(num) {
            return Math.floor(((num / 750) * this.screenWidth) + 1e-4);
        },
        toFixed(num, decimal = 2) {
            num = num - 0;
            var p1 = Math.pow(10, decimal + 1);
            var p2 = Math.pow(10, decimal);
            return (Math.round(num * p1 / 10) / p2).toFixed(decimal);
        },
        drawLine(startX, startY, endX, endY) {
            const { ctx } = this;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        },
        canvasStartEvent(e) {
            let { x } = e.touches[0];
            this.touchstartX = x;
            this.moveX = x;
            clearTimeout(this.longtapTimer);
            this.longtapTimer = setTimeout(() => {
                if (this.touchstartX == this.moveX) {
                    this.isDragging = false;
                    this.crossGrid(e);
                } else {
                    this.isDragging = true;
                }
            }, 500);
        },
        canvasMoveEvent(e) {
            // 拖动大于16.7毫秒才生效
            let nowTime = new Date().getTime();
            if (nowTime - this.moveLastTime < 16.7) {
                return;
            }
            this.moveLastTime = new Date().getTime();
            const { ctx, xScale, touchstartX, node: { width, height }, visibleNum } = this;
            // let x = e.changedTouches[0].clientX;
            let x = e.changedTouches[0].x;
            let moveX = null,
                len = this.data.list.length - visibleNum;
            this.moveX = x;
            // true则代表拖动k线图 false则代表开启十字架
            if (this.isDragging) {
                ctx.clearRect(0, 0, width, height);
                // 左边
                if (x > this.touchstartX) {
                    // 乘以0.4是为了降低滑动速度
                    moveX = (x - touchstartX) * 0.4;
                    // (xScale - 0.8)是柱子宽度
                    let moveNum = (moveX / xScale / (xScale - 0.8)).toFixed(0);
                    moveNum = Number(moveNum)
                    this.startIndex -= moveNum;
                }
                // 右边
                else {
                    moveX = (touchstartX - x) * 0.4;
                    let moveNum = (moveX / xScale / (xScale - 0.8)).toFixed(0);
                    moveNum = Number(moveNum)
                    this.startIndex += moveNum;
                }
                this.startIndex = this.startIndex <= 1 ? 1 : this.startIndex;
                this.startIndex = this.startIndex >= len ? len : this.startIndex;
                this.timeInfo = {};
                this.startDraw();
            } else {
                this.crossGrid(e);
            }
        },
        canvasEndEvent(e) {
            const { node: { width, height }, ctx2 } = this;
            this.isDragging = true;
            // 松手后十字架消失
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                ctx2.clearRect(0, 0, width, height)
                this.triggerEvent('clear');
            }, 1600);
        },
        crossGrid(e) {
            const { node: { width, height }, xScale, ctx2, canvas2, startIndex, visibleNum } = this;
            let { list, ml, mt, topHight, botHight, space, crossColor } = this.ConvertQuery();
            // let { pageX: x, pageY: y } = e.changedTouches[0];
            let { x, y } = e.touches[0];
            list = list.slice(startIndex, startIndex + visibleNum);
            // 因为使用的是catchtouchmove所以获取到的x y是相对窗口的而不是相对canvas的所以需要减去canvas的边界信息
            // x = x - canvas2._left;
            // y = y - canvas2._top;
            this.isDragging = false;
            // 边界处理 超出边界就等于边界
            if (x <= ml) x = ml;
            if (x > width) x = width;
            if (y <= 0) y = mt;
            if (y >= topHight) y = topHight;
            let index = Math.floor(x / xScale);
            if (!list[index]) return false;
            // 清空画布
            ctx2.clearRect(0, 0, width, height);
            // 十字架
            ctx2.save();
            ctx2.strokeStyle = crossColor;
            this.drawBrokenLine(ctx2, ml, y, width, y);
            this.drawBrokenLine(ctx2, x, mt, x, topHight + botHight + space);
            ctx2.restore();
            // 往父级发送选中的数据
            this.triggerEvent('stockInfo', { data: list[index] })
        },
        drawBrokenLine(ctx, startX, startY, endX, endY) {
            ctx.save();
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.restore();
        },
    }
})