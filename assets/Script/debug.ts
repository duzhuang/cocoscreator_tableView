import tableView from "../Components/tableView/tableView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    @property({ type: tableView, tooltip: '' })
    tab: tableView = null;

    @property({ type: tableView, tooltip: '' })
    tab2: tableView = null;

    private _initData = [ { itemData: "张三" },{ itemData: "李四" }, { itemData: "王二" }, { itemData: "麻子" }, { itemData: "你" }, { itemData: "好" }, { itemData: "玩" }, { itemData: "吧" }]
    private _initData2 = [ { itemData: "张三" },{ itemData: "李四" }, { itemData: "王二" }, { itemData: "麻子" }, { itemData: "你" }]
    private _initData3 = [ { itemData: "张三" },{ itemData: "李四" }, { itemData: "王二" }, { itemData: "麻子" }, { itemData: "你" }, { itemData: "好" }, { itemData: "玩" }, { itemData: "吧" }].concat([{ itemData: "333" },{ itemData: "333" },{ itemData: "333" },{ itemData: "333" },{ itemData: "333" },{ itemData: "333" },{ itemData: "333" }]);

    onLoad() {
        cc.game.on("itemDestroy", (data) => {
            if(data.index){
                this._formateDate(data.index);
                this.tab2.refresh(this._initData);
            }
        })
    }

    private _formateDate(index: number) {
        this._initData.splice(index, 1);
    }

    start() {
        cc.game.setFrameRate(30);
    }

    onClick(){
        this.tab2.init(this._initData2);
        //this.tab2.init([{ itemData: "张三" }, { itemData: "李四" }]); //{ itemData: "王二" }, { itemData: "麻子" }
        this.tab.init([{ itemData: "张三" }, { itemData: "李四" }, { itemData: "王二" }, { itemData: "麻子" },{ itemData: "你" }, { itemData: "好" },{ itemData: 1 }, { itemData: 2 }, { itemData: 3 }, { itemData: 1 }, { itemData: 2 }, { itemData: 3 }, { itemData: 1 }, { itemData: 2 }, { itemData: 3 }, { itemData: 1 }, { itemData: 2 }, { itemData: 3 }, { itemData: 1 }, { itemData: 2 }, { itemData: 3 }])  
    }

    onClickReload(){
        if (Math.random() > 0.5) {
            this.tab2.refresh(this._initData2);
        } else {
            this.tab2.refresh(this._initData3);
        }
    }

    onClear(){
        //this.tab.clear();
        this.tab2.clear();
    }

    onClickLeft(){
        this.tab2.scrollToBottom();
        this.tab.scrollToLeft();
    }

    onClickRight(){
        this.tab2.scrollToTop();
        this.tab.scrollToRight();
    }

    onClickAdd(){
        this._initData2.push({ itemData: "新增" })
        this.tab2.refresh(this._initData2);
        this.tab2.scrollToTop();
    }

    // update (dt) {}
}
