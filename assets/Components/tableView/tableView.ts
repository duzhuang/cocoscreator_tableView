import viewCell from "./viewCell";

const { ccclass, property } = cc._decorator;

/**滑动的方式 Horizontal 水平滑动  Vertical 垂直滑动 */
const ScrollModel = cc.Enum({
    Horizontal: 0,
    Vertical: 1,
})

/**对node节点进行扩充，添加自己d定义的属性 */
interface tableCell extends cc.Node {
    /**当前实际的下标 */
    cellIndex: number,
    /**将要转变的下标(用于增删操作) */
    _cellIndex: number
}

@ccclass
export default class tableView extends cc.ScrollView {

    @property({ override: true, visible: false, tooltip: "重写父类的属性" })
    horizontal: boolean = false;

    @property({ override: true, visible: false, tooltip: "重写父类的属性" })
    vertical: boolean = true;


    @property(cc.Prefab)
    _cell: cc.Prefab = null;

    @property({ type: cc.Prefab, tooltip: "cell的预制体" })
    get cell() {
        return this._cell;
    }
    set cell(value) {
        if (value as cc.Prefab) {
            this._cell = value;
        }
    }

    @property({ type: ScrollModel })
    _ScrollModel = ScrollModel.Vertical;

    @property({ type: ScrollModel, tooltip: '滑动的方向' })
    get ScrollModel() {
        return this._ScrollModel;
    }
    set ScrollModel(value) {
        if (value == ScrollModel.Horizontal) {
            this.horizontal = true;
            this.vertical = false;
        } else if (value == ScrollModel.Vertical) {
            this.horizontal = false;
            this.vertical = true;
        }
        this._ScrollModel = value;
    }

    //====================================================本地存储的数据
    /**当前cell的具体数据 */
    private _cellData: any = null;
    /**当前cell的宽/高 */
    private _cellSize: number = null;
    /**当前cell的数量 */
    private _cellCount: number = null;
    /**当前总cell的数量 */
    private _allCellCount: number = null;
    /**cell节点的对象池 */
    private _cellPool: cc.NodePool = new cc.NodePool();

    /**最大的开始下标 */
    private _maxStartIndex: number = null;
    /**开始的下标 */
    private _startIndex: number = null;
    /**结束的下标 */
    private _endIndex: number = null;

    /**距离content的top的距离 */
    private _contentTopY: number = null;
    /**距离content的left的距离 */
    private _contentLeftX: number = null;

    /**是否刷新当前的cell */
    private _updateCellsOn: boolean = false;
    /**刷新一次cell */
    private _updateCellsOnce: boolean = false;
    //====================================================生命周期函数

    onLoad() {
    }

    start() {

    }

    onEnable() {
        this.node.on("scroll-began", this.onEventScrollBegin, this);
        this.node.on("scroll-ended", this.onEventScrollEnd, this);

        super.onEnable();
    }

    onDisable() {
        this.node.off("scroll-began", this.onEventScrollBegin, this);
        this.node.off("scroll-ended", this.onEventScrollEnd, this);

        super.onDisable();
    }


    update(dt) {
        super.update(dt);
        if (this._updateCellsOn || this._updateCellsOnce) {
            this._updateCells();
        }
    }

    //====================================================onEvent
    /**
     * 移动开始响应事件
     */
    private onEventScrollBegin() {
        this._updateCellsOn = true;
    }

    /**
     * 移动结束响应事件
     */
    private onEventScrollEnd() {
        this._updateCellsOn = false;
    }

    //=========================================================================共有方法

    /**
     * 初始化tableView
     * @param data 
     */
    public init<T>(data: Array<T>): void {
        this._cellData = data;
        this._allCellCount = data.length;
        this._init();
    }

    /**
     * 刷新tableView
     * @param data 
     */
    public refresh<T>(data: Array<T>): void {
        this._cellData = data;
        this._allCellCount = data.length;
        this._cellCount = this._getCellCount();
        this.stopAutoScroll(); // 如果不加上这句，就会在移动的时候自己滑动
        this._setContentSize();
        this._setMaxStartIndex();
        this._updateCells(true);
    }

    /**
     * 清空tableView
     */
    public clear() {
        this._cellData = null;
        this._allCellCount = 0;
        this._cellCount = 0;
        this._startIndex = 0;
        this._maxStartIndex = 0;
        this._endIndex = 0;
        this._contentLeftX = 0;
        this._contentTopY = 0;
        this._setContentSize();
        this._setContentPosition();
        this._setMaxStartIndex();
        this._updateCellsCount();
    }

    //========================================================================= 私有方法

    /**
     * 初始化
     */
    private _init() {
        //确保各种组件已挂载
        if (CC_DEBUG) {
            if (!this.content) {
                return cc.error("【tableView】请指定content")
            }
            if (!this._cell) {
                return cc.error("【tableView】请指定cell")
            }
            if (!<viewCell>this._cell.data.getComponent(viewCell)) {
                return cc.error("【tableView】请在cell中添加继承自<viewCell>的自定义组件")
            }
        }
        this._cellSize = this._getCellSize();
        this._cellCount = this._getCellCount();
        this._setContentSize();
        this._setContentPosition();
        this._setMaxStartIndex();
        this._updateCells();
    }

    /**
     * 获取当前cell的宽度/高度
     * @returns 
     */
    private _getCellSize() {
        let size: number = null;
        //cell上不能挂载widget组件
        if (this._cell.data.getComponent(cc.Widget)) {
            console.error("【tableView】cell上不可挂载widget组件")
            return size;
        }

        if (this._cell) {
            if (this._ScrollModel == ScrollModel.Horizontal) {
                size = this._cell.data.getContentSize().width;
            } else if (this._ScrollModel == ScrollModel.Vertical) {
                size = this._cell.data.getContentSize().height;
            } else {
                size = cc.macro.ZERO;
            }
        } else {
            size = cc.macro.ZERO;
        }
        return size;
    }

    /**
     * 获取当前view中展示的cell的数量
     * @returns 
     */
    private _getCellCount() {
        let cellCount: number = null;
        let viewSize: number = null;
        if (this._ScrollModel == ScrollModel.Horizontal) {
            viewSize = this.content.parent.width;
        } else {
            viewSize = this.content.parent.height;
        }
        cellCount = Math.ceil(viewSize / this._cellSize) + 1;
        if (cellCount > this._allCellCount) {
            cellCount = this._allCellCount;
        }
        return cellCount;
    }

    /**
     * 设置content的高度/宽度
     */
    private _setContentSize() {
        let contentSize = this._cellSize * this._allCellCount;
        if (this._ScrollModel == ScrollModel.Horizontal) {
            this.content.width = contentSize;
            this._contentLeftX = -this.content.width / 2;
        } else {
            this.content.height = contentSize;
            this._contentTopY = this.content.height / 2;
        }
    }

    /**
     * 设置content的位置
     */
    private _setContentPosition() {
        let pos: number = null;
        if (this._ScrollModel == ScrollModel.Horizontal) {
            pos = this.content.parent.width / 2 - this.content.width / 2;
            this.content.x = -pos;
        } else {
            pos = this.content.parent.height / 2 - this.content.height / 2;
            this.content.y = pos;
        }
    }

    /**
     * 设置开始的最大下标
     */
    private _setMaxStartIndex() {
        if (this._allCellCount > this._cellCount) {
            this._maxStartIndex = this._allCellCount - this._cellCount;
        } else {
            this._maxStartIndex = 0;
        }
    }


    /**
     * 获取cell预制体
     * @returns 
     */
    private _getCell(): tableCell {
        let tempNode: tableCell = null;
        if (this._cellPool.size()) {
            tempNode = <tableCell>this._cellPool.get();
        } else {
            tempNode = <tableCell>cc.instantiate(this._cell);
        }
        tempNode.cellIndex = -1;
        tempNode._cellIndex = -1;
        return tempNode;
    }

    /**
     * 将预制体放入对象池中
     */
    private _putCell(cell: tableCell): void {
        this._cellPool.put(cell);
    }

    /**
     * 更新cell的具体数量
     */
    private _updateCellsCount() {
        let nowCount: number = this.content.childrenCount;
        const children: tableCell[] = <tableCell[]>this.content.children;
        if (nowCount == this._cellCount) {
            return;
        } else if (nowCount < this._cellCount) {
            for (let i = nowCount; i < this._cellCount; i++) {
                this.content.addChild(this._getCell());
            }
        } else {
            for (let index = nowCount - 1; index >= this._cellCount; index--) {
                let cell = children[index]
                if (cell._cellIndex < this._startIndex || cell._cellIndex > this._endIndex) {
                    this._unInitCell(cell);
                    this._putCell(cell);
                }
            }

            for (let index = nowCount - 1; index >= this._cellCount; index--) {
                let cell = children[index];
                if(cell){
                    this._unInitCell(cell);
                    this._putCell(cell);
                }
            }
        }
    }

    /**
     * 更新cell显示的具体下标，根据content的具体位置来计算对应的展示cell
     */
    private _updateCellRange() {
        const scrollLen = this.getScrollOffset(); //获取滚动视图相对于左上角原点的当前滚动偏移
        let offset: number = null;
        if (this.ScrollModel == ScrollModel.Horizontal) {
            offset = -scrollLen.x;
        } else {
            offset = scrollLen.y;
        }

        if (offset < 0) {
            offset = 0;
        }
        let startIndex = Math.floor(offset / this._cellSize); //开始的index
        if (startIndex < 0) {
            startIndex = 0;
        } else if (startIndex > this._maxStartIndex) {
            startIndex = this._maxStartIndex;
        }

        this._startIndex = startIndex;
        this._endIndex = this._startIndex + this._cellCount - 1;
    }

    private _initCell(cell: tableCell, index: number) {
        if (index >= 0) {
            if(cell.cellIndex != index || cell.cellIndex != cell._cellIndex){
                const com = cell.getComponent(viewCell);
                if(cell.cellIndex>0){
                    com.unInit();
                }
                com.init(index, this._cellData[index], this);
            }
            cell._cellIndex = index;
            cell.cellIndex = index;
        }
    }

    private _unInitCell(cell: tableCell) {
        if (cell.cellIndex >= 0) {
            cell.cellIndex = -1;
            cell._cellIndex = -1;
        }
    }

    /**
     * 刷新单个cell的显示
     */
    private _updateCell(cell: tableCell, index?: number) {
        //刷新cellIndex和_cellIndex
        if (typeof index === "number") {
            this._initCell(cell, index);
        }else{
            this._initCell(cell,cell._cellIndex);
            index = cell.cellIndex;
        }

        if (this._ScrollModel == ScrollModel.Horizontal) {
            cell.x = this._contentLeftX - this._cellSize / 2 + this._cellSize * (index + 1);
        } else {
            cell.y = this._contentTopY + this._cellSize / 2 - this._cellSize * (index + 1);
        }
    }

    /**
     * 刷新cell的具体显示
     * @param force 是否强制刷新展示的cell
     */
    private _updateCells(force?: boolean) {
        this._updateCellsOnce = false;

        this._updateCellRange();
        this._updateCellsCount();

        if (!this._cellCount) return;
        const startIndex = this._startIndex; //开始的index
        const endIndex = this._endIndex; //结束的index
        const children: tableCell[] = <tableCell[]>this.content.children; //content的所有子节点
        //无需计算
        if (children[0]._cellIndex == startIndex && children[children.length - 1].cellIndex == endIndex && !force) {
            return;
        }else{
            children.forEach((cell, index) => {
                console.log("wanba 当前的cell的具体数据", cell._cellIndex, cell.cellIndex);
                this._updateCell(cell, startIndex + index);
            })
            return;
        }

        const keepCell: tableCell[] = [];   //不需要刷新的cell
        const changeCell: tableCell[] = [];     //需要刷新的cell

        children.forEach(cell => {
            if (cell._cellIndex < startIndex || cell._cellIndex > endIndex || cell._cellIndex != cell.cellIndex) {
                this._unInitCell(cell);
                changeCell.push(cell);
            } else {    
                keepCell.push(cell);
            }
        })

        if (changeCell.length == 0) {
            //无需进行刷新
        } else if (keepCell.length == 0) {
            children.forEach((cell, index) => {
                this._updateCell(cell, startIndex + index);
                //cell.getComponent(viewCell).init(startIndex + index, this._cellData[startIndex + index]);
            })
        } else {
            for (let index = startIndex, keepPoint = 0, changePoint = 0, i = 0; index <= endIndex; index++ , i++) {
                if (keepPoint < keepCell.length && index == keepCell[keepPoint]._cellIndex) {
                    this._updateCell(keepCell[keepPoint++]);
                } else {
                    this._updateCell(changeCell[changePoint++], index);
                }
            }
        }


        children.forEach(cell => {
            cell.zIndex = cell.cellIndex - startIndex;
        })

        this.content.sortAllChildren();
    }

    //===========================================================================================对scrollView方法的重写

    scrollToLeft(timeInSecond?: number, attenuated?: boolean) {
        if (timeInSecond) {
            this._updateCellsOn = true;
        } else {
            this._updateCellsOnce = true;
        }
        super.scrollToLeft(timeInSecond, attenuated);
    }

    scrollToRight(timeInSecond?: number, attenuated?: boolean) {
        if (timeInSecond) {
            this._updateCellsOn = true;
        } else {
            this._updateCellsOnce = true;
        }
        super.scrollToRight(timeInSecond, attenuated);
    }

    scrollToTop(timeInSecond?: number, attenuated?: boolean) {
        if (timeInSecond) {
            this._updateCellsOn = true;
        } else {
            this._updateCellsOnce = true;
        }
        super.scrollToTop(timeInSecond, attenuated);
    }

    scrollToBottom(timeInSecond?: number, attenuated?: boolean) {
        if (timeInSecond) {
            this._updateCellsOn = true;
        } else {
            this._updateCellsOnce = true;
        }
        super.scrollToBottom(timeInSecond, attenuated);
    }
}
