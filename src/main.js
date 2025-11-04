/**
 * Vue3 学习框架 - 入口文件
 * 
 * 这个文件展示了如何使用我们实现的Vue3核心功能：
 * 1. 创建响应式状态
 * 2. 定义组件
 * 3. 挂载组件到页面
 * 
 * 示例：一个简单的计数器组件
 */

import { createApp } from './core/component.js';
import { h } from './core/vdom/index.js';

/**
 * 计数器组件
 * 这是一个函数式组件，接收state作为参数，返回虚拟DOM
 * 
 * @param {Object} state - 组件状态（响应式数据）
 * @returns {Object} 虚拟DOM节点
 */
function Counter(state) {
  return h('div', { class: 'counter' }, [
    h('h1', {}, 'Vue3 核心概念学习'),
    h('div', { class: 'counter-value' }, String(state.count || 0)),
    h('div', {}, [
      h('button', {
        onClick: () => {
          // 修改响应式数据，会自动触发组件重新渲染
          state.count++;
        }
      }, '增加'),
      h('button', {
        onClick: () => {
          // 修改响应式数据，会自动触发组件重新渲染
          state.count--;
        }
      }, '减少'),
      h('button', {
        onClick: () => {
          // 重置计数器
          state.count = 0;
        }
      }, '重置')
    ])
  ]);
}

/**
 * 定义组件
 * 使用对象形式定义组件，包含setup和render函数
 */
const App = {
  /**
   * setup函数：组件的初始化逻辑
   * 返回的对象会被转换为响应式数据
   * 
   * @returns {Object} 组件的状态和方法
   */
  setup() {
    // 定义响应式状态
    return {
      count: 0  // 这个count会被转换为响应式数据
    };
  },
  
  /**
   * render函数：定义组件的渲染逻辑
   * 接收state作为参数，返回虚拟DOM
   * 
   * @param {Object} state - 组件状态（响应式数据）
   * @returns {Object} 虚拟DOM节点
   */
  render(state) {
    return Counter(state);
  }
};

// 获取挂载点
const container = document.getElementById('app');

// 创建并挂载应用
// 当state.count变化时，组件会自动重新渲染
createApp(App, container);

console.log('Vue3 学习框架已启动！');
console.log('你可以打开开发者工具查看响应式系统的工作原理。');

