/**
 * Vue3 Diff算法演示 - Todo列表示例
 * 
 * 这个示例展示了使用key优化列表更新的效果
 * 对比：有key vs 无key的性能差异
 */

import { createApp } from './core/component.js';
import { h } from './core/vdom/index.js';

const TodoApp = {
  setup() {
    return {
      todos: [
        { id: 1, text: '学习Vue3响应式系统', done: false },
        { id: 2, text: '理解虚拟DOM原理', done: false },
        { id: 3, text: '掌握diff算法', done: false }
      ],
      inputValue: ''
    };
  },
  
  render(state) {
    return h('div', { style: 'padding: 20px; max-width: 600px; margin: 0 auto;' }, [
      h('h1', {}, 'Todo列表 - Diff算法演示'),
      h('p', { style: 'color: #666;' }, '使用key可以优化列表更新性能，复用DOM节点'),
      
      // 输入框
      h('div', { style: 'margin: 20px 0;' }, [
        h('input', {
          type: 'text',
          value: state.inputValue,
          onInput: (e) => {
            state.inputValue = e.target.value;
          },
          placeholder: '输入新任务...',
          style: 'padding: 8px; width: 300px; margin-right: 10px;'
        }),
        h('button', {
          onClick: () => {
            if (state.inputValue.trim()) {
              state.todos.push({
                id: Date.now(),
                text: state.inputValue.trim(),
                done: false
              });
              state.inputValue = '';
            }
          },
          style: 'padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;'
        }, '添加')
      ]),
      
      // Todo列表（使用key优化）
      h('ul', { style: 'list-style: none; padding: 0;' }, 
        state.todos.map(todo => 
          h('li', { 
            key: todo.id,  // 关键：使用key来优化diff
            style: `
              padding: 12px;
              margin: 8px 0;
              background: ${todo.done ? '#e8f5e9' : '#fff'};
              border: 1px solid #ddd;
              border-radius: 4px;
              display: flex;
              align-items: center;
              gap: 10px;
            `
          }, [
            h('input', {
              type: 'checkbox',
              checked: todo.done,
              onChange: () => {
                todo.done = !todo.done;
              }
            }),
            h('span', {
              style: `text-decoration: ${todo.done ? 'line-through' : 'none'}; flex: 1;`
            }, todo.text),
            h('button', {
              onClick: () => {
                const index = state.todos.findIndex(t => t.id === todo.id);
                if (index > -1) {
                  state.todos.splice(index, 1);
                }
              },
              style: 'padding: 4px 8px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;'
            }, '删除')
          ])
        )
      ),
      
      h('div', { style: 'margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;' }, [
        h('h3', {}, 'Diff算法说明：'),
        h('ul', { style: 'padding-left: 20px;' }, [
          h('li', {}, '使用key：Vue可以快速识别哪些节点是同一个，只更新变化的部分'),
          h('li', {}, '删除/添加：只操作变化的节点，复用其他节点'),
          h('li', {}, '排序：通过key映射，最小化DOM移动操作'),
          h('li', {}, '性能：O(n)复杂度，而不是O(n²)')
        ])
      ])
    ]);
  }
};

// 如果要运行这个示例，取消下面的注释
// const container = document.getElementById('app');
// createApp(TodoApp, container);

