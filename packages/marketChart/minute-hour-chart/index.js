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
        // 数据长度
        dataLength: {
            type: Number,
            value: 240
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
        lineColor: {
            type: String,
            value: '#1988F4'
        },
        lineWidth: {
            type: Number,
            value: 1
        },
        // 侧边框背景颜色
        cuurentActiveBgColor: {
            type: String,
            value: '#E8E9EC'
        },
        // 侧边价格文字颜色
        currentActiveColor: {
            type: String,
            value: '#1988F4'
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
        this.linePoint = [];            // 折线点位
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
                        this.startDraw();

                        query
                            .select(`#touchMove`)
                            .fields({ node: true, size: true })
                            .exec((res) => {
                                let canvas2 = res[1].node
                                canvas2.width = res[1].width * devicePixelRatio;
                                canvas2.height = res[1].height * devicePixelRatio;
                                this.ctx2 = canvas2.getContext('2d');
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
            // 绘制开盘闭盘时间
            this.drawTime();
            // 计算涨幅
            this.computedMark();
            // 绘制分时指标
            this.drawNorm();
            // x轴刻度
            this.markX();
            // 绘制分时
            this.drawMinuteLine();
            // 绘制背景色
            this.drawBgColor();
            // 绘制尾点
            this.drawLastPoint();
            // 绘制均线
            this.drawAverage();
            // 绘制成交量
            this.drawTurnover();
        },
        drawAverage() {
            const { ctx, xScale, maxVal, minVal } = this;
            const { list, topHight, averageColor } = this.ConvertQuery();
            const yScale = this.markY({
                height: topHight,
                maxVal,
                minVal
            })
            ctx.save();
            ctx.strokeStyle = averageColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < list.length; i++) {
                let x = i * xScale,
                    y = yScale * (maxVal - list[i][2]);
                if (i == 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            ctx.restore();
        },
        drawLastPoint() {
            const { ctx, xScale, maxVal, minVal } = this;
            const { list, lineColor, topHight } = this.ConvertQuery();
            const yScale = this.markY({
                height: topHight,
                maxVal,
                minVal
            })
            let x = (list.length - 1) * xScale,
                y = yScale * (maxVal - list[list.length - 1][1]);
            ctx.save();
            ctx.beginPath();
            ctx.fillStyle = lineColor;
            ctx.arc(x, y, 2, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.restore();
        },
        drawTurnover() {
            const { ctx, xScale, tMaxVal, tMinVal, } = this;
            const { list, botHight, downColor, upColor, topHight, space, textColor } = this.ConvertQuery();
            let yScale = this.markY({
                height: botHight,
                maxVal: tMaxVal,
                minVal: tMinVal
            });
            ctx.save();
            ctx.lineWidth = 1;
            for (let i = 0; i < list.length; i++) {
                let x = i * xScale,
                    y = (topHight + space) + (tMaxVal - list[i][3]) * yScale;
                ctx.fillStyle = list[i][4] < list[i][5] ? upColor : downColor;
                ctx.beginPath();
                ctx.rect(x, y, xScale, list[i][3] * yScale);
                ctx.fill();
            }
            ctx.fillStyle = textColor;
            ctx.fillText(list[list.length - 1][3].toFixed(2), 6, topHight + space + 12);
            ctx.restore();
        },
        drawMinuteLine() {
            const { list = [] } = this.data;
            const { ctx, xScale, maxVal, minVal } = this;
            const { topHight, lineColor, lineWidth } = this.ConvertQuery();
            const yScale = this.markY({
                height: topHight,
                maxVal,
                minVal
            })
            ctx.save();
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            for (let i = 0; i < list.length; i++) {
                let x = i * xScale,
                    y = yScale * (maxVal - list[i][1]);
                if (i == 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
                this.linePoint[i] = { x, y };
            }
            ctx.restore();
        },
        drawNorm() {
            const { width } = this.node;
            const { ctx, rect: { maxRang, minRang, maxPrice, minPrice } } = this;
            const { upColor, downColor, flatColor, base_info: { prev_close_px }, topHight } = this.ConvertQuery();
            ctx.save();
            ctx.font = `sans-serif`;
            // 顶部
            ctx.fillStyle = upColor;
            ctx.fillText(maxPrice, 0, 12);
            ctx.fillText(maxRang + '%', width - ctx.measureText(maxRang + '%').width, 12);
            // 中间
            ctx.fillStyle = flatColor;
            ctx.fillText(prev_close_px, 0, topHight / 2);
            ctx.fillText('0.00%', width - ctx.measureText('0.00%').width, topHight / 2);
            // 底部
            ctx.fillStyle = downColor;
            ctx.fillText(minPrice, 0, topHight);
            ctx.fillText(minRang + '%', width - ctx.measureText(minRang + '%').width, topHight);
            ctx.restore();
        },
        markX() {
            const { dataLength } = this.data;
            this.xScale = this.node.width / dataLength;
        },
        markY({ height, maxVal, minVal }) {
            return height / (maxVal - minVal);
        },
        computedMark() {
            const { ctx } = this;
            const { base_info: { prev_close_px, new_price, type = 1 }, list } = this.data;
            // 涨停价
            this.ratioTop = Math.round(prev_close_px * 1.1).toFixed(2);
            // 跌停价
            this.ratioBot = Math.round(prev_close_px * 0.9).toFixed(2);
            let turnover = [];
            let arr = list.reduce((acc, item) => {
                acc.push(item[1]);
                turnover.push(item[3]);
                return acc;
            }, []);
            // 折线最大值、最小值
            this.maxVal = Math.max(...arr);
            this.minVal = Math.min(...arr);
            // 成交量最大值、最小值
            this.tMaxVal = Math.max(...turnover);
            this.tMinVal = Math.min(...turnover);
            // 十字架侧边骨架
            this.textWidth = ctx.measureText(this.maxVal).width + 14;
            // 边界处理
            if (this.tMinVal > 0) this.tMinVal = 0;
            if (this.tMaxVal < 0 && this.tMinVal < 0) this.tMaxVal = 0;
            // 当前价小于跌停价 || 新股不限涨幅
            if ((new_price < this.ratioTop) || type == 2) {
                let maxRang = (((new_price - prev_close_px) / prev_close_px) * 100).toFixed(2);
                // 1 - 2.58 / 100 是将涨幅转化为百分数形式，即将 2.58 转换为 0.0258。然后用 1 减去这个百分数，得到的结果是 0.9742，表示价格相对于昨收的下跌幅度。最终的计算结果为昨收价格乘以这个下跌幅度，即 15.53 * 0.9742。
                let minVal = this.toFixed(prev_close_px * (1 - maxRang / 100));
                this.rect = {
                    maxRang,        // 最大幅度
                    minRang: `-${maxRang}`,     // 最小幅度
                    maxPrice: new_price,        // 最大价格
                    minPrice: minVal            // 最小价格
                }
                this.minVal = minVal;
            } else {
                let maxRang = (((this.maxVal - prev_close_px) / prev_close_px) * 100).toFixed(2),
                    minVal = toFixed(prev_close_px * (1 - maxRang / 100));
                this.rect = {
                    maxRang,
                    minRang: `-${maxRang}`,
                    maxPrice: this.maxVal,
                    minPrice: minVal
                }
                this.minVal = minVal;
            }
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
        drawVolumeGrid() {
            const { ctx } = this;
            let { topHight, botHight, gridWidth, gridColor, space, mb } = this.ConvertQuery();
            const { width } = this.node;
            this.botScale = botHight / 2;
            ctx.save();
            // ctx.translate(0.5, 0.5);
            ctx.lineWidth = gridWidth;
            ctx.strokeStyle = gridColor;
            let hight = topHight + space;
            this.drawLine(0, hight + this.botScale, width, hight + this.botScale);
            this.drawLine(0, hight, width, hight);
            this.drawLine(0, hight + botHight - 1, width, hight + botHight - 1);
        },
        drawLine(startX, startY, endX, endY) {
            const { ctx } = this;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
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
        drawTime() {
            const { ctx } = this;
            let { topHight, botHight, textColor, space, mb } = this.ConvertQuery();
            const { width } = this.node;
            let first = '9.30',
                center = '11:30/13:00',
                last = '15:00';
            ctx.save();
            ctx.fillStyle = textColor;
            ctx.fillText(first, 0, topHight + space + botHight + 12)
            ctx.fillText(center, (width / 2) - (ctx.measureText(center).width / 2), topHight + space + botHight + 12)
            ctx.fillText(last, width - ctx.measureText(last).width, topHight + space + botHight + 12)
        },
        Convert(num) {
            return Math.floor(((num / 750) * this.screenWidth) + 1e-4);
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
        drawBgColor() {
            const { ctx, xScale } = this;
            const { topHight, list, lineColor } = this.ConvertQuery();
            ctx.lineTo((list.length - 1) * xScale, topHight);
            ctx.lineTo(0, topHight);
            var gradient = ctx.createLinearGradient(0, 0, 0, topHight);
            gradient.addColorStop(0, `rgba(${this.hexToRGBA(lineColor.substr(1))},0.25)`);
            gradient.addColorStop(1, `rgba(${this.hexToRGBA(lineColor.substr(1))},0.00)`);
            ctx.fillStyle = gradient;
            ctx.fill();
        },
        // 十字架
        canvasMoveEvent(e) {
            const { node: { width, height }, ctx2, linePoint } = this;
            const { list, ml, mt, topHight, botHight, space, crossColor, currentActiveColor, cuurentActiveBgColor } = this.ConvertQuery();
            let { x, y } = e.touches[0];
            // 边界处理 超出边界就等于边界
            if (x <= ml) x = ml;
            if (x > width) x = width;
            if (y <= 0) y = mt;
            if (y >= topHight) y = topHight;
            let index = Math.floor(x / this.xScale);
            if (!list[index]) return false;
            // 清空画布
            ctx2.clearRect(0, 0, width, height);
            // 十字架
            ctx2.save();
            ctx2.strokeStyle = crossColor;
            this.drawBrokenLine(ctx2, ml, y, width, y);
            this.drawBrokenLine(ctx2, x, mt, x, topHight + botHight + space);
            ctx2.restore();

            // 侧边当前节点价格
            let textHeight = 15;
            ctx2.save();
            ctx2.fillStyle = cuurentActiveBgColor;
            ctx2.font = '12px Arial';
            if (y - (textHeight / 2) <= 0) {
                ctx2.fillRect(0, 0, this.textWidth, textHeight);
                ctx2.fillStyle = currentActiveColor;
                ctx2.fillText(list[index][1], this.textWidth / 2 - ctx2.measureText(list[index][1]).width / 2, (textHeight / 2) + 3);
            } else {
                ctx2.fillRect(0, y - (textHeight / 2), this.textWidth, textHeight);
                ctx2.fillStyle = currentActiveColor;
                ctx2.fillText(list[index][1], this.textWidth / 2 - ctx2.measureText(list[index][1]).width / 2, y + textHeight / 2 - 3);
            }
            ctx2.restore();

            ctx2.save();
            let textWidth = 40;
            ctx2.fillStyle = cuurentActiveBgColor;
            ctx2.font = '12px Arial';
            if (x - (textWidth / 2) <= 0) {
                ctx2.fillRect(0, topHight + space + botHight, textWidth, textHeight);
                ctx2.fillStyle = currentActiveColor;
                ctx2.fillText(list[index][0], textWidth / 2 - ctx2.measureText(list[index][0]).width / 2, topHight + space + botHight + 12);
            } else if (x + textWidth / 2 >= width) {
                ctx2.fillRect(width - textWidth, topHight + space + botHight, textWidth, textHeight);
                ctx2.fillStyle = currentActiveColor;
                ctx2.fillText(list[index][0], width - textWidth / 2 - ctx2.measureText(list[index][0]).width / 2, topHight + space + botHight + 12);
            } else {
                ctx2.fillRect(x - textWidth / 2, topHight + space + botHight, textWidth, textHeight);
                ctx2.fillStyle = currentActiveColor;
                ctx2.fillText(list[index][0], x - ctx2.measureText(list[index][0]).width / 2, topHight + space + botHight + 12);
            }
            ctx2.restore();

            // 松手后十字架消失
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                ctx2.clearRect(0, 0, width, height)
            }, 1600);
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
        hexToRGBA(hex) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return `${r}, ${g}, ${b}`;
        },
        toFixed(num, decimal = 2) {
            num = num - 0;
            var p1 = Math.pow(10, decimal + 1);
            var p2 = Math.pow(10, decimal);
            return (Math.round(num * p1 / 10) / p2).toFixed(decimal);
        },
        clearCanvas() {
            const { ctx, node: { width, height } } = this;
            ctx.save();
            ctx.clearRect(0, 0, width, height);
            ctx.restore();
            this.startDraw();
        }
    }
})