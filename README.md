![logo](./assets/logo.png)

---

一个可以使搬砖更快乐的 `Taro` 扩展库

目前提供了一组有状态的组件基类，只要使页面或组件继承对应的类，就可以享受非常舒适的 “双向数据绑定” 服务。


# 扩展库自述

## 我是在什么情况下出生的？

我的作者是一个重度 `Angular` 开发者，从 `Angular.js` 到 `Angular 10`，双向数据绑定已经在他的心中形成了一种习惯。他最近接手了一个小程序，一直对 `Taro` 比较感兴趣，正好又赶在了 `Taro3` 发布之际，所以他决定着手尝试一下。

可是从 `Angular` 跳到相对陌生的 `React`，对他来说有些烫手，在尝试了 `Redux`、`MBox`、和原生的 `setState` 后，他写出了第一版自动刷新工具：


[【讨论贴】给React加上强制刷新，是种什么体验？](https://github.com/NervJS/nerv/issues/163)


这个帖子反响并不是很好，他自己也知道帖子中的方法并不是一个理想的方式。所以他开始研究 `Vue` 所使用的 `Proxy`。

经过几天实验，终于功夫不负有心人，我出生了。


## 如何在 `Taro` 中拥有我？
由于作者的 `npm` 账户不是 `vip` 账户，且公有包已经满5个了，所以无法推送至 `npm`。

不过值得欣慰的是 npm 可以通过 github 链接安装：

```
npm install git+https://github.com/Eusen/taro-extras.git
```


## 我能干什么？

目前我最大的作用就是提供双向数据绑定：
1. 你可以在组件类中随意定义属性，并且利用 `this.xxx = ''` 就可以更新页面上的值（我会感知到你的更新，并通知当前页面进行刷新）。
2. 我可以绑定你指定的方法，将其this指向代理对象，这样你就可以不用写箭头函数，就可以访问正确的 this。

``` tsx
export default class IndexPage extends Stateful.Page {
  list = [{name: 'bob'}];

  // 当自定义方法需要访问或改变this中的属性值时，请用 `@Stateful.bind()` 进行绑定
  @Stateful.bind()
  async load() {
    const resp = await Taro.request({...});
    // 赋值后，页面也会刷新
    this.list = resp.data.objects;
  }

  // 如果该方法没有访问 `this` 中的属性，则可以不用 `@Stateful.bind()` 绑定
  reverse() {
    return item => {
      item.name = item.name.split('').reverse().join('');
    }
  }

  render() {
    return (
      <View className='header-component'>
        {
          this.list.map((item, key) => {
            return (
              <View key={key}>
                <View>{item.name}</View>
                <Button onClick={this.reverse(item)}>Reverse</Button>
              </View>
            )
          })
        }
        // 直接写 this.load 就行，因为 bind 过，所以不用担心指向问题
        <Button onClick={this.load}>LoadMore</Button>
      </View>
    )
  }
}
```
上面这个例子已经能够说明我的作用，我只有在你赋值的时候才会更新页面，有很高的效率和性能。


## 在我帮助你时，你需要注意的地方

1. `1.1.0` 版本后，不再需要 state 属性，大家可以将其忽略，或作为一个普通属性看待；取而代之的是 `@Stateful.bind()` 绑定过的方法，可以直接访问 this 中的属性。

2. 组件需要继承 `Stateful.Component`，页面需要继承 `Stateful.Page`。

3. 请 `implements` 以下 `Proxy Hooks` 以替代对应的 `React Hooks`
	- ProxyAfterViewInit: `componentDidMount` => `afterViewInit` 推荐将数据初始化操作放在这里
	- ProxyOnChanges: `shouldComponentUpdate` => `onChanges`
	- ProxyOnCatch: `componentDidCatch` => `onCatch`
	- ProxyOnDestroy: `componentWillUnmount` => `onDestroy`

4. 如果你在项目中使用了我，就可以把其他所有的状态管理包都删掉了哦

5. 'render', 'afterViewInit', 'onChanges', 'onCatch', 'onDestroy' 这几个方法可以不用 `Stateful.bind()`，因为我已经绑定过了。

## 谁创造了我？

[@Eusen](https://github.com/Eusen)


## 参与创造我的人

暂时还没有伙伴加入呢~


## 下一步计划

暂无计划，希望大家能积极尝试反馈，如果觉得好就给个小星星呗~
