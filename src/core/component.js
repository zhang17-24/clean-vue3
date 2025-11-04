/**
 * Vue3 组件系统核心实现
 * 
 * 这个文件实现了简单的组件系统：
 * 1. 组件定义：使用函数或对象定义组件
 * 2. 组件渲染：将组件渲染为虚拟DOM
 * 3. 组件挂载：将组件挂载到真实DOM
 * 
 * 核心概念：
 * - 组件本质是一个返回虚拟DOM的函数
 * - 组件可以有自己的状态（响应式数据）
 * - 组件可以响应数据变化自动重新渲染
 */

import { reactive, effect } from './reactivity/index.js';
import { h } from './vdom/index.js';
import { render, patch } from './vdom/index.js';

/**
 * 创建组件实例并挂载
 * 
 * @param {Object|Function} component - 组件定义（可以是函数或对象）
 * @param {HTMLElement} container - 挂载容器
 * @returns {Object} 组件实例
 */
export function createApp(component, container) {
  // 组件实例
  let instance = null;
  
  // 当前的虚拟DOM
  let currentVnode = null;
  
  // 更新函数：重新渲染组件
  const update = () => {
    // 生成新的虚拟DOM
    const newVnode = renderComponent(instance);
    
    if (currentVnode) {
      // 如果已有虚拟DOM，则更新（patch）
      patch(currentVnode, newVnode);
    } else {
      // 如果是首次渲染，直接挂载
      render(newVnode, container);
    }
    
    // 更新当前虚拟DOM
    currentVnode = newVnode;
  };
  
  // 创建组件实例
  if (typeof component === 'function') {
    // 函数式组件：直接使用函数作为render函数
    instance = {
      render: component,
      setup: () => ({}) // 函数式组件没有setup
    };
  } else {
    // 对象式组件：需要setup函数返回数据和方法
    instance = {
      render: component.render || (() => h('div', {}, 'No render function')),
      setup: component.setup || (() => ({}))
    };
  }
  
  // 执行setup函数，获取组件状态和方法
  const setupResult = instance.setup();
  
  // 将setup返回的数据转换为响应式（如果返回的是对象）
  instance.state = typeof setupResult === 'object' && setupResult !== null
    ? reactive(setupResult)
    : {};
  
  // 使用effect监听状态变化，自动更新组件
  effect(() => {
    update();
  });
  
  return instance;
}

/**
 * 渲染组件为虚拟DOM
 * 
 * @param {Object} instance - 组件实例
 * @returns {Object} 虚拟DOM节点
 */
function renderComponent(instance) {
  // 调用render函数，传入组件状态，生成虚拟DOM
  return instance.render(instance.state);
}

