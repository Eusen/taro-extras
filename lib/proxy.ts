import {Component, ErrorInfo} from 'react';
import * as Taro from '@tarojs/taro';

/**
 * 排除的实例属性
 */
const EXCLUDE_KEYS = ['state', 'refs', 'props', 'context', 'updater', '_reactInternalFiber', '_reactInternalInstance'];

/**
 * 会影响数组的方法
 */
const ARRAY_INFLUENTIAL_METHODS = ['push', 'pop', 'unshift', 'shift', 'slice', 'reverse', 'fill', 'copyWithin', 'sort'];

/**
 * 当注入时触发的方法定义
 */
export type OnSet = (key?: PropertyKey, oldValue?: any, newValue?: any) => void;


/**
 * 代理 Hooks
 */
export interface ProxyOnInit {
  onInit(): any;
}

export interface ProxyAfterViewInit {
  afterViewInit(): any;
}

export interface ProxyOnChanges<P = any> {
  onChanges?(nextProps: Readonly<P>, nextState: Readonly<this>, nextContext: any): boolean;
}

export interface ProxyOnCatch {
  onCatch(error: Error, errorInfo: ErrorInfo): any;
}

export interface ProxyOnDestroy {
  onDestroy(): any;
}


/**
 * 代理工厂
 */
export class ProxyFactory {
  private static pagesMap: { [key: string]: Component & {_isMounted: boolean} } = {};

  private static setPage(page: any) {
    this.pagesMap[page.props.tid] = page;
  }

  /**
   * 提醒当前页面进行刷新
   */
  static notify() {
    const pages = Taro.getCurrentPages();
    const lastPage = pages[pages.length - 1];
    const targetPage = this.pagesMap[lastPage.route];
    if (targetPage._isMounted) {
      this.pagesMap[lastPage.route].forceUpdate();
    }
  }

  /**
   * 创建组件代理
   * @param component 组件
   */
  static createComponentProxy(component: any) {
    const proxy = new Proxy(component, new ObjectProxy(() => this.notify()));

    // 重新绑定方法的 this
    if (component.constructor.decorator) {
      component.constructor.decorator.methods.forEach(method => {
        if (component[method]) {
          component[method] = component[method].bind(proxy);
        }
      });
    }

    proxyMethod(component, 'componentDidMount', () => {
      component._isMounted = true;
      readFields(component, key => {
        // 因为把代理逻辑写在了set方法里，所以这里需要把值重新赋值，以触发代理
        proxy[key] = component[key] || proxy[key];
      });
      component.afterViewInit && component.afterViewInit();
    }, true);

    proxyMethod(component, 'shouldComponentUpdate', (...args: any[]) => {
      if (component.onChanges) {
        return component.onChanges(...args)
      }
      return true;
    }, true);

    proxyMethod(component, 'componentDidCatch', (...args: any[]) => {
      component.onCatch && component.onCatch(...args);
    }, true);

    proxyMethod(component, 'componentWillUnmount', () => {
      component._isMounted = false;
      component.onDestroy && component.onDestroy();
    }, true);

    return proxy;
  }


  /**
   * 代理页面
   * @param page 页面
   */
  static createPageProxy(page: any) {
    this.setPage(page);
    return this.createComponentProxy(page);
  }
}

/**
 * 对象代理
 */
export class ObjectProxy implements ProxyHandler<any> {
  constructor(private onSet: OnSet) {
  }

  get(target: any, key: PropertyKey, _receiver: any): any {
    return target[key];
  }

  set(target: any, key: PropertyKey, newValue: any, _receiver: any): boolean {
    if (newValue === null || newValue == undefined) return true;

    const oldValue = target[key];
    target[key] = boundObjectProxy(newValue, this.onSet);
    this.onSet(key, oldValue, newValue);
    return true;
  }
}

/**
 * 绑定对象代理
 * @param value 值
 * @param onSet 当注入时触发的方法
 */
export function boundObjectProxy(value: any, onSet: OnSet) {
  if (!value) {
    return value;
  }

  if (typeof value === 'object') {
    if (value instanceof Array) {
      value = value.map(item => {
        return boundObjectProxy(item, onSet);
      });

      value = proxyArray(value, new Proxy(value, new ObjectProxy(onSet)));
    } else {
      Object.keys(value).forEach(key => {
        if (EXCLUDE_KEYS.includes(key) || typeof value[key] === 'function') return;

        try {
          value[key] = boundObjectProxy(value[key], onSet);
        } catch (e) {
          // 当属性为 readonly 时，赋值会报错，可以忽略
        }
      });
      value = new Proxy(value, new ObjectProxy(onSet));
    }
  }

  return value;
}


/**
 * 读取属性
 * @param instance 实例
 * @param read 读取方法
 */
export function readFields<T = any>(instance: T, read: (key: string, instance?: T) => any) {
  Object.keys(instance).forEach(key => {
    if (EXCLUDE_KEYS.includes(key) || typeof instance[key] === 'function') return;
    read(key, instance);
  })
}


/**
 * 代理方法
 * @param instance 实例
 * @param methodName 方法名
 * @param newMethod 新方法
 * @param isReplace 是否替换
 */
export function proxyMethod(instance: any, methodName: string, newMethod: (...args: any[]) => any, isReplace = false) {
  const replaced = instance[methodName];
  if (isReplace) {
    instance[methodName] = newMethod;
  } else {
    instance[methodName] = (...args: any[]) => {
      let result = newMethod(...args);
      if (replaced) {
        result = replaced(...args);
      }
      return result;
    };
  }
}

/**
 * 代理数组
 * @param array 数组
 * @param proxy 代理
 */
export function proxyArray(array: any, proxy: any) {
  ARRAY_INFLUENTIAL_METHODS.forEach(key => {
    array[key] = array[key].bind(proxy);
  });
  return proxy;
}
