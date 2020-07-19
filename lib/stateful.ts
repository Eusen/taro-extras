import {Component} from 'react';
import {ProxyFactory, DEFAULT_INNER_METHODS} from './proxy';

export class Stateful {
  /**
   * 绑定方法
   * 当自定义方法需要访问或改变this中的属性值时，请用 @Stateful.bind() 进行绑定：
   * ``` tsx
   * export default class IndexPage extends Stateful.Page {
   *   list: any[];
   *
   *   @Stateful.bind()
   *   appendItem() {
   *     // 目前已经绑定数组方法，所以可以直接通过 push 等函数刷新页面。
   *     this.list.push({name: 'Nice!'});
   *   }
   * }
   * ```
   */
  static bind() {
    return (instance: any, methodName: string) => {
      let decorator = instance.constructor.decorator;
      if (!decorator) {
        instance.constructor.decorator = decorator = new this.Decorator();
      }
      decorator.addMethod(methodName);
    }
  }

  private static Decorator = class StatefulDecorator {
    methods: string[] = DEFAULT_INNER_METHODS;

    addMethod(method: string) {
      if (!this.methods.includes(method)) {
        this.methods.push(method);
      }
    }
  }


  /**
   * 有状态的组件
   * ``` tsx
   * export default class HeaderComponent extends Stateful.Component {
   *   list = [{name: 'bob'}];
   *
   *   // 如果该方法没有访问 this 中的属性，则可以不用 @Stateful.bind() 绑定
   *   reverse() {
   *     return item => {
   *       item.name = item.name.split('').reverse().join('');
   *     }
   *   }
   *
   *   render() {
   *     return (
   *       <View className='header-component'>
   *         {
   *           this.list.map((item, key) => {
   *             return (
   *               <View key={key}>
   *                 <View>{item.name}</View>
   *                 <Button onClick={this.reverse(item)}>Reverse</Button>
   *               </View>
   *             )
   *           })
   *         }
   *       </View>
   *     )
   *   }
   *
   * }
   * ```
   */
  static Component = class StatefulComponent<P = any> extends Component<P> {
    constructor(props: P) {
      super(props);
      ProxyFactory.createComponentProxy(this);
    }
  };


  /**
   * 有状态的页面
   * ``` tsx
   * export default class IndexPage extends Stateful.Page {
   *   list = [{name: 'bob'}];
   *
   *   @Stateful.bind()
   *   async load() {
   *     const resp = await Taro.request({...});
   *     this.list = resp.data.objects;
   *   }
   *
   *   render() {
   *     return (
   *       <View className='header-component'>
   *         {
   *           this.list.map(item => {
   *             return (
   *               <View>
   *                 <View>{item.name}</View>
   *               </View>
   *             )
   *           })
   *         }
   *         <Button onClick={this.load}>LoadMore</Button>
   *       </View>
   *     )
   *   }
   *
   * }
   * ```
   */
  static Page = class StatefulPage<P = any> extends Component<P> {
    constructor(props: P) {
      super(props);
      ProxyFactory.createPageProxy(this);
    }
  };
}
