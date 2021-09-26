# cocoscreator_tableView
基于cocoscreator实现tableView
### 使用方法
1、在节点挂载tableView脚本

2、指定content和cell（item的预制体）以及scrollModel（滑动类型）

3、子节点的脚本必须继承viewCell脚本，并重新init方法来进行实例化

### 初始化tableView节点
使用init方法对tableView进行初始化
```javascript
tableView.init([子节点数组])
```
### 支持的scrollView的方法
因为tableView是基于scrollView来进行完成的，重写了部分scrollView组件的方法：

1、scrollToLeft(timeInSecond?: number, attenuated?: boolean)  //滑动到左侧

2、scrollToRight(timeInSecond?: number, attenuated?: boolean)  //滑动到右侧

3、scrollToTop(timeInSecond?: number, attenuated?: boolean)   //滑动到顶部

4、scrollToBottom(timeInSecond?: number, attenuated?: boolean)   //滑动到底部

