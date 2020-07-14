![logo](./assets/logo.png)

---

一个可以使搬砖更快乐的 Taro 扩展库

目前提供了一组有状态的组件基类，只要使页面或组件继承对应的类，就可以享受非常舒适的 “双向数据绑定” 服务。


# 扩展库自述

## 我是在什么情况下出生的？
我的作者是一个重度Angular开发者，从Angularjs到Angular10，双向数据绑定已经在他的心中形成了一种习惯。他最近接手了一个小程序，一直对Taro比较感兴趣，正好又赶在了Taro3发布之际，所以他决定着手尝试一下。

可是从Angular跳到相对陌生的React，对他来说有些烫手，在尝试了Redux、MBox、和原生的setState后，他写出了第一版自动刷新工具：

```
【讨论贴】给React加上强制刷新，是种什么体验？
https://github.com/NervJS/nerv/issues/163
```

这个帖子反响并不是很好，他自己也知道帖子中的方法并不是一个理想的方式。所以他开始研究 vue 所使用的 Proxy。

经过几天实验，终于功夫不负有心人，我出生了。


## 如何在Taro中拥有我？
由于作者的 npm 账户不是 vip账户，且公有包已经满5个了，所以无法推送至npm。

不过值得欣慰的是 npm 可以通过 github 链接安装：

```
npm install git+https://github.com/Eusen/taro-extras.git
```


## 我能干什么？

目前我最大的作用就是提供双向数据绑定：你可以在组件类中定义属性，并且利用 `this.state.xxx = ''` 更新值，我会感知到你的更新，并通知当前页面进行刷新。

``` tsx
import React from 'react';
import {View, Button, Input, Text} from '@tarojs/components';
// 导入 StatefulPage，组件请用 StatefulComponent
import {StatefulPage} from "taro-extras";

import './index.scss'

export default class Index extends StatefulPage {
  // 直接定义属性
  list: any[] = [{value: '', sublist: [{value: ''}]}];

  addItem = () => {
    // 添加新元素的话，还是需要这种方式，我暂时还没有拦截数组方法
    // 这里还是利用了 state ，但是不用担心，我将 state 的类型设置成了 this
    // 这样你就可以像访问 this 一样，访问 state
    this.state.list = [
      ...this.state.list,
      {
        value: ''
      }
    ];
  }

  input = item => {
    return (e) => {
      // 直接更新数组中的属性（不管几层），不需要 setState() 
      item.value = e.detail.value;
    }
  }

  reset = item => {
    return () => {
      // 直接更新数组中的属性（不管几层），不需要 setState()
      item.value = '';
    };
  }

  render() {
    return (
      <View className='index'>
        {
          this.state.list.map((item, key) => {
            return (
              <View key={key}>
                <Text>Item</Text>
                <Input value={item.value} onInput={this.input(item)} />
                <Button onClick={this.reset(item)}>Reset</Button>
                {
                  // 这里你可以看到是一个二维数组，
                  // 即便是二维数组中的值，也可以直接赋值
                  // 赋值后页面会自动刷新
                  item.sublist && item.sublist.map((subitem, key2) => {
                    return (
                      <View key={key2}>
                        <Text>Subitem</Text>
                        <Input value={subitem.value} onInput={this.input(subitem)} />
                        <Button onClick={this.reset(subitem)}>Reset</Button>
                      </View>
                    )
                  })
                }
              </View>
            )
          })
        }
        <Button onClick={this.addItem}>Add Item</Button>
      </View>
    )
  }
}

```
上面这个例子虽然比较丑，但已经能够说明我的实力，我只有在你赋值的时候才会更新页面。


## 在我帮助你时，你需要注意的地方

1. this.state 就是 Proxy，因为我的作者还没有想到如何替换页面中的this，如果想到了，也许就不需要 this.state 了~

2. 数组目前还是需要 [...arr, {}] 先解构再加新值。


## 谁创造了我？

[@Eusen](https://github.com/Eusen).


## 参与创造我的人

暂时还没有伙伴加入呢~


## 下一步计划

上面提到的两个问题就是下一步要解决的问题。

作者说他突然想的可以利用方法的bind来绑定proxy，这样就可以不用state挂载了。

数组的话也可以拦截方法，也许近期我会迎来一次升级~
