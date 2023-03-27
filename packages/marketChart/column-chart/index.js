Component({
    properties: {
        mode: {
            type: Number,
            value: 1
        },
        canvasId: {
            type: String,
            value: ''
        },
        list: {
            type: Array,
            value: []
        },
        width: {
            type: Number,
            value: 686
        },
        height: {
            type: Number,
            value: 226
        },
        // 首柱宽度
        first_bar: {
            type: Number,
            value: 16
        },
        // 尾柱宽度
        last_bar: {
            type: Number,
            value: 16
        },
        // 两柱间隔
        chink: {
            type: Number,
            value: 4
        },
        // 是否开启折线
        isLine: {
            type: Boolean,
            value: false
        },
        // 起始线颜色
        startLineColor: {
            type: String,
            value: "#f4f5f6"
        },
        // 首柱颜色
        firstBarColor: {
            type: String,
            value: "#1988F4"
        },
        lastBarColor: {
            type: String,
            value: "#8694AA"
        },
        lineColor: {
            type: String,
            value: "#FDAF5E"
        },
        lineWidth: {
            type: Number,
            value: 1
        },
        arcRadius: {
            type: Number,
            value: 2
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
        this.maxVal = 0;        // 最大值
        this.minVal = 0;        // 最小值
        this.xScale = 0;        // x轴刻度
        this.yScale = 0;        // y轴刻度
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
                        this.startDraw();
                    })
            }
            setCanvas();
        },
        startDraw() {
            // 处理最大值最小值
            this.computedData();
            // 计算x轴刻度
            this.xMark();
            // 绘起始线条
            this.draw_beginLine();
            // 绘制柱状
            this.draw_bar();
            // 绘制折线
            this.draw_line();
        },
        computedData() {
            const { list = [] } = this.data;
            let radio = [],
                lastValue = [];
            const arr = list.reduce((acc, item) => {
                acc.push(item.first_value);
                radio.push(item.radio);
                lastValue.push(item.last_value);
                return acc;
            }, []);
            let first_bar_maxval = Math.max(...arr);
            let first_bar_minval = Math.min(...arr);
            if (first_bar_minval > 0) first_bar_minval = 0;
            if (first_bar_maxval < 0 && first_bar_minval < 0) first_bar_maxval = 0;
            // 首柱刻度
            this.first_bar_maxval = first_bar_maxval;
            this.first_bar_minval = first_bar_minval;
            // 尾柱刻度
            this.last_bar_maxval = Math.max(...lastValue);
            this.last_bar_minval = Math.max(...lastValue);
            // 折线刻度
            this.line_maxval = Math.max(...radio);
            this.line_minval = Math.max(...radio);
        },
        xMark() {
            const { width } = this.node;
            const { mode, list, ml, mr } = this.data;
            if (mode == 1 || mode == 2) {
                this.xScale = (width - (ml + mr)) / list.length;
            }
        },
        yMark(maxVal, minVal) {
            const { height } = this.node;
            const { mt, mb, mode } = this.data;
            return (height - (mt + mb)) / (maxVal - minVal);
        },
        draw_beginLine() {
            const { ctx, first_bar_maxval, first_bar_minval, node } = this;
            const { startLineColor, ml, mr, mt } = this.data;
            const yScale = this.yMark(first_bar_maxval, first_bar_minval);
            ctx.save();
            ctx.strokeStyle = startLineColor;
            ctx.beginPath();
            ctx.moveTo(ml, yScale * first_bar_maxval + mt);
            ctx.lineTo((node.width - (ml + mr)) + ml, yScale * first_bar_maxval + mt)
            ctx.stroke();
            ctx.restore();
        },
        draw_bar() {
            const { mode } = this.data;
            // 绘制单柱
            if (mode == 1) {
                this.draw_first_bar();
            } else if (mode == 2) {
                this.draw_last_bar();
            }
        },
        draw_first_bar() {
            const { ctx, first_bar_maxval, first_bar_minval, xScale } = this;
            const { list, firstBarColor, ml, mt, first_bar } = this.data;
            const yScale = this.yMark(first_bar_maxval, first_bar_minval);
            ctx.save();
            for (let i = 0; i < list.length; i++) {
                let x = ml + i * xScale,
                    y = mt + (first_bar_maxval - list[i].first_value) * yScale;
                ctx.fillStyle = firstBarColor;
                ctx.beginPath();
                ctx.rect(x + (xScale / 2) - (first_bar / 2), y, first_bar, list[i].first_value * yScale);
                ctx.fill();
                let textY = y;
                if (list[i].first_value > 0) textY -= 4;
                else textY += 10;
                ctx.fillText(list[i].first_value, x + (xScale / 2) - (first_bar / 2), textY);
            }
            ctx.restore();
        },
        draw_last_bar() {
            const { ctx, first_bar_maxval, first_bar_minval, xScale } = this;
            const { list, firstBarColor, ml, mt, first_bar, last_bar, chink, lastBarColor } = this.data;
            const yScale = this.yMark(first_bar_maxval, first_bar_minval);
            ctx.save();
            for (let i = 0; i < list.length; i++) {
                let x = ml + i * xScale,
                    first_y = mt + (first_bar_maxval - list[i].first_value) * yScale,
                    last_y = mt + (first_bar_maxval - list[i].last_value) * yScale;
                // 绘制首柱
                ctx.beginPath();
                ctx.fillStyle = firstBarColor;
                ctx.rect(x + (xScale / 2) - first_bar, first_y, first_bar, list[i].first_value * yScale);
                let firstText_y = first_y;
                if (list[i].first_value > 0) firstText_y -= 4;
                else firstText_y += 10;
                ctx.fillText(list[i].first_value, x + (xScale / 2) - first_bar - (first_bar / 2), firstText_y);
                ctx.fill();
                // 绘制尾柱
                ctx.beginPath();
                ctx.fillStyle = lastBarColor;
                ctx.rect(x + (xScale / 2) + chink, last_y, last_bar, list[i].last_value * yScale);
                let lastText_y = last_y;
                if (list[i].first_value > 0) lastText_y -= 4;
                else lastText_y += list[i].last_value * yScale + 10;
                ctx.fillText(list[i].last_value, x + (xScale / 2) + chink, lastText_y);
                ctx.fill();
            }
            ctx.restore();
        },
        draw_line() {
            const { ctx, first_bar_maxval, first_bar_minval, xScale } = this;
            const { list, ml, mt, first_bar, last_bar, chink, lineColor, lineWidth, mode, arcRadius, isLine } = this.data;
            const yScale = this.yMark(first_bar_maxval, first_bar_minval);
            if (mode > 2 || !isLine) return false;
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = lineWidth;
            for (let i = 0; i < list.length; i++) {
                let x = ml + i * xScale,
                    y = mt + (first_bar_maxval - list[i].ratio) * yScale;
                if (mode == 1) {
                    x = x + (xScale / 2);
                } else {
                    x = x + (xScale / 2) - (first_bar / 2)
                }
                if (i == 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
                // 绘制圆点
                ctx.beginPath();
                ctx.fillStyle = lineColor;
                ctx.arc(x, y, arcRadius, 0, Math.PI * 2, false);
                ctx.fill();
            }
            ctx.restore();
        }
    }
})