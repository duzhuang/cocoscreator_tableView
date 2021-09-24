import viewCell from "../Components/tableView/viewCell";

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends viewCell {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    @property({ type: cc.Label, tooltip: '' })
    btnLabel: cc.Label = null;

    private _itemIndex: number = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}
    
    init(index, data) {
        super.init(index, data);
        this.label.string = data.itemData;
        this._itemIndex = index;
    }

    reload(data) {
        super.reload(data);
        this.label.string = data.itemData;
    }

    onClick(){
        console.log("wanba 这是玩家点击的第几个item",this._itemIndex);
    }

    /**
     * 点击销毁对应的item
     */
    onClickDestroy(){
        cc.game.emit("itemDestroy", { index: this._itemIndex });
    }

    onClickBtn(){
        this.btnLabel.string = this._itemIndex + "";
    }

    // update (dt) {}
}
