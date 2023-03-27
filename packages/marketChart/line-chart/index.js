Component({
    properties: {
        // 1 无标签模式 2 带标签模式
        mode: {
            type: Number,
            value: 1
        },
        canvasId: {
            type: String,
            value: ''
        },
        // 数据长度
        dataLength: {
            type: Number,
            value: 25
        },
        width: {
            type: Number,
            value: 580
        },
        height: {
            type: Number,
            value: 166
        },
        list: {
            type: Array,
            value: []
        },
        subList: {
            type: Array,
            value: []
        },
        // 是否开始十字架
        isMove: {
            type: Boolean,
            value: false
        },
        // 线条色
        lineColor: {
            type: String,
            value: '#FF8300'
        },
        // 线条宽度
        lineWidth: {
            type: Number,
            value: 1
        },
        subLineColor: {
            type: String,
            value: '#1988F4'
        },
        // 背景色
        bgColor: {
            type: String,
            value: '255,131,0'
        },
        // 是否显示当前圆圈命中点
        isArc: {
            type: Boolean,
            value: false
        },
        // 圆圈颜色
        arcColor: {
            type: Boolean,
            value: '#5EABF7'
        },
        // 十字架颜色
        crossColor: {
            type: Boolean,
            value: '#5EABF7'
        },
        // 圆圈半径
        arcRadius: {
            type: Number,
            value: 2
        },
        // 是否绘制标签
        isLabel: {
            type: Boolean,
            value: false
        },
        // 标签数
        labelNum: {
            type: Number,
            value: 5
        },
        // 末尾圆圈半径
        lastRadius: {
            type: Number,
            default: 0
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
        this.xScale = 0;        // x轴刻度
        this.yScale = 0;        // y轴刻度
        this.mainLine = [];     // 主线x y数据
        this.subLine = [];     // 次线x y数据
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
                        const { devicePixelRatio = 0 } = await wx.getSystemInfo();
                        canvas.width = res[0].width * devicePixelRatio;
                        canvas.height = res[0].height * devicePixelRatio;
                        this.ctx = canvas.getContext('2d');
                        this.ctx.transform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
                        this.openDraw();

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
        openDraw() {
            // 处理最大值最小值
            this.computedData();
            // 计算x轴刻度
            this.xMark();
            // 计算y轴的刻度
            this.yMark();
            // 绘制标签
            this.drawLabel();
            // 绘制折线
            this.drawLine();
            // 绘制次折线
            this.drawSubLine();
            // 绘制圆圈
            this.drawArc()
            // 绘制尾点圆圈
            this.drawLastArc();
        },
        computedData() {
            const { list = [] } = this.data;
            const arr = list.reduce((acc, item) => {
                acc.push(item.value);
                return acc;
            }, []);
            let maxVal = Math.max(...arr);
            let minVal = Math.min(...arr);
            if (minVal > 0) minVal = 0;
            if (maxVal < 0 && minVal < 0) maxVal = 0;
            this.maxVal = maxVal;
            this.minVal = minVal;
        },
        xMark() {
            const { width } = this.node;
            const { ml, mr, dataLength } = this.data;
            this.xScale = (width - (ml + mr)) / dataLength;
        },
        yMark() {
            const { height } = this.node;
            const { mt, mb } = this.data;
            this.yScale = (height - (mt + mb)) / (this.maxVal - this.minVal);
        },
        drawLabel() {
            const { ml, mt, mr, labelNum, isLabel } = this.data;
            const { ctx, yScale, maxVal, minVal } = this;
            if (!isLabel) return false;
            let diff = (maxVal - minVal) / (labelNum - 1);
            ctx.textBaseline = "middle";
            ctx.strokeStyle = '#F4F5F6';
            ctx.fillStyle = "#BCBEC2";
            for (let i = 0; i < labelNum; i++) {
                let text = (maxVal - i * diff).toFixed(2),
                    x = ml - (ctx.measureText(`${text}%`).width + 4),
                    y = mt + yScale * (maxVal - text);
                ctx.fillText(`${text}%`, x, y);
                this.drawBrokenLine(ctx, ml, y, (this.node.width - (ml + mr)) + ml, y);
            }
        },
        drawBrokenLine(ctx, startX, startY, endX, endY) {
            ctx.save();
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 5]);
            ctx.translate(0.5, 0.5);	// 解决1px下 线条粗细不一的情况
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.restore();
        },
        drawLine() {
            const { list = [], lineColor, ml, mt, lineWidth } = this.data;
            const { ctx, xScale, yScale, maxVal } = this;
            ctx.save();
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = lineColor;
            ctx.beginPath();
            for (let i = 0; i < list.length; i++) {
                let x = ml + i * xScale,
                    y = mt + yScale * (maxVal - list[i].value); // 加my是为了顶部流出空间
                if (i == 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                this.mainLine[i] = { x, y };
            }
            ctx.stroke();
            // 绘制背景
            this.drawBgColor();
            ctx.restore();
        },
        drawSubLine() {
            const { subList = [], ml, mt, lineWidth, subLineColor } = this.data;
            if (subList.length <= 0) return false;
            const { ctx, xScale, yScale, maxVal } = this;
            ctx.save();
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = subLineColor;
            ctx.beginPath();
            for (let i = 0; i < subList.length; i++) {
                let x = ml + i * xScale,
                    y = mt + yScale * (maxVal - subList[i].value); // 加my是为了顶部流出空间
                if (i == 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                this.subLine[i] = { x, y };
            }
            ctx.stroke();
            ctx.restore();
        },
        drawArc() {
            const { list = [], isArc, arcColor, arcRadius, ml, mt } = this.data;
            const { ctx, xScale, yScale, maxVal } = this;
            if (!isArc) return false;
            ctx.save();
            for (let i = 0; i < list.length; i++) {
                let x = ml + i * xScale,
                    y = mt + yScale * (maxVal - list[i].value); // 加my是为了顶部流出空间
                ctx.beginPath();
                ctx.fillStyle = "white";
                ctx.arc(x, y, arcRadius, 0, Math.PI * 2, false);
                ctx.fill();
                ctx.strokeStyle = '#FF8300';
                ctx.stroke();
                if (list[i].isflag) {
                    ctx.beginPath();
                    ctx.fillStyle = arcColor;
                    ctx.arc(x, y, arcRadius / 2, 0, Math.PI * 2, false);
                    ctx.fill();
                }
            }
            ctx.restore();
        },
        drawBgColor() {
            const { list = [], bgColor, ml, mr } = this.data;
            const { ctx, xScale } = this;
            const { height } = this.node;
            ctx.lineTo(ml + (list.length - 1) * xScale, height);
            ctx.lineTo(ml, height);
            var gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, `rgba(${bgColor},0.20)`);
            gradient.addColorStop(1, `rgba(${bgColor},0.00)`);
            ctx.fillStyle = gradient;
            ctx.fill();
        },
        drawLastArc() {
            const { list = [], lastRadius, lineColor, ml, mt } = this.data;
            const { ctx, xScale, yScale, maxVal } = this;
            if (lastRadius <= 0) return false;
            ctx.save();
            for (let i = 0; i < list.length; i++) {
                let x = ml + i * xScale,
                    y = mt + yScale * (maxVal - list[i].value); // 加my是为了顶部流出空间
                if (i === list.length - 1) {
                    ctx.beginPath();
                    ctx.fillStyle = this.hexToRGBA(lineColor.substr(1), 0.5);
                    ctx.arc(x, y, lastRadius + 3, 0, Math.PI * 2, false);
                    ctx.fill();

                    ctx.beginPath();
                    ctx.fillStyle = lineColor;
                    ctx.arc(x, y, lastRadius, 0, Math.PI * 2, false);
                    ctx.fill();
                }
            }
            ctx.restore();
        },
        canvasMoveEvent(e) {
            const { isMove, ml, mr, mt, arcRadius, crossColor, arcColor } = this.data;
            const { mainLine, node, ctx2, subLine } = this;
            // 实际折线绘制宽度
            const width = (node.width - (ml + mr)) + ml;
            // 不开启十字架就退出
            if (!isMove) return false;
            let { x } = e.touches[0];
            // 边界处理 超出边界就等于边界
            if (x <= ml) x = ml;
            if (x > width) x = width;
            // 计算手指移动下标
            let index = Math.floor((x - ml) / this.xScale);
            // 清空画布
            ctx2.clearRect(0, 0, node.width, node.height)
            // 十字架
            ctx2.save();
            ctx2.strokeStyle = crossColor;
            this.drawBrokenLine(ctx2, ml, mainLine[index].y, width, mainLine[index].y);
            this.drawBrokenLine(ctx2, mainLine[index].x, mt, mainLine[index].x, node.height);
            ctx2.restore();
            // 主中心圆点
            ctx2.save();
            ctx2.beginPath();
            ctx2.fillStyle = arcColor;
            ctx2.arc(mainLine[index].x, mainLine[index].y, arcRadius, 0, Math.PI * 2, false);
            ctx2.fill();
            ctx2.restore();
            // 次中心圆点
            ctx2.save();
            ctx2.beginPath();
            ctx2.fillStyle = arcColor;
            ctx2.arc(subLine[index].x, subLine[index].y, arcRadius, 0, Math.PI * 2, false);
            ctx2.fill();
            ctx2.restore();

            // 松手后十字架消失
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                ctx2.clearRect(0, 0, node.width, node.height)
            }, 1600);
        },
        hexToRGBA(hex, alpha) {
            const r = parseInt(hex.slice(0, 2), 16);
            const g = parseInt(hex.slice(2, 4), 16);
            const b = parseInt(hex.slice(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        },
        clearCanvas() {
            const { ctx } = this;
            const { width, height } = this.node;
            ctx.clearRect(0, 0, width, height);
            this.openDraw();
        }
    }
})