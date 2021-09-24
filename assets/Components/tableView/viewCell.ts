import tableView from "./tableView";

const { ccclass, property } = cc._decorator;


@ccclass
export default class viewCell extends cc.Component {
    static getSize(index: number, data?: any): number {
        return 0;
    }

    init(index: number, data?: any, tv?: tableView) {
        
    }

    unInit() {
        
    }

    reload(data?: any) {
        
    }
}
