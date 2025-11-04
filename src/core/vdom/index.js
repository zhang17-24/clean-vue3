/**
 * Vue3 虚拟DOM和渲染器核心实现
 * 
 * 这个文件实现了Vue3风格的虚拟DOM和diff算法：
 * 1. 虚拟DOM节点结构（VNode）
 * 2. 渲染器：将虚拟DOM渲染到真实DOM
 * 3. 高效的diff算法：比较新旧虚拟DOM，只更新变化的部分
 * 
 * 核心概念：
 * - 虚拟DOM：用JavaScript对象描述DOM结构
 * - 渲染器：将虚拟DOM转换为真实DOM并挂载到页面
 * - diff算法：Vue3风格的优化算法，支持：
 *   - 节点复用：相同类型的节点复用DOM元素
 *   - 属性diff：只更新变化的属性
 *   - key优化：使用key快速识别和复用节点
 *   - 最小化DOM操作：减少重排重绘，提升性能
 * 
 * 性能优化：
 * - 时间复杂度：O(n)，其中n是节点数量
 * - 空间复杂度：O(n)，用于存储映射关系
 * - 相比清空重建，性能提升显著
 */

/**
 * 创建虚拟DOM节点（VNode）
 * 
 * @param {string} tag - 标签名（如 'div', 'button'等）
 * @param {Object} props - 属性对象（如 { id: 'app', class: 'container', key: 'item1' }）
 * @param {Array|string} children - 子节点数组（可以是字符串或VNode）
 * @returns {Object} 虚拟DOM节点对象
 * 
 * 示例：
 * h('div', { id: 'app' }, [
 *   h('h1', {}, 'Hello'),
 *   h('button', { onClick: () => {} }, 'Click me')
 * ])
 * 
 * 使用key优化列表更新：
 * h('ul', {}, items.map(item => 
 *   h('li', { key: item.id }, item.text)
 * ))
 */
export function h(tag, props = {}, children = []) {
  // 如果children是单个值，转换为数组
  if (!Array.isArray(children) && children !== undefined && children !== null) {
    children = [children];
  }
  
  return {
    tag,        // 标签名
    props,      // 属性（可能包含key）
    children,   // 子节点
    key: props.key, // 提取key，用于diff优化
    el: null    // 对应的真实DOM元素（渲染后才会设置）
  };
}

/**
 * 将虚拟DOM渲染到真实DOM
 * 
 * @param {Object} vnode - 虚拟DOM节点
 * @param {HTMLElement} container - 挂载容器（真实DOM元素）
 */
export function render(vnode, container) {
  // 如果container已有vnode，使用patch更新（而不是清空重建）
  if (container._vnode) {
    // 使用diff算法高效更新
    patch(container._vnode, vnode);
  } else {
    // 首次渲染，直接挂载
    mount(vnode, container);
  }
  
  // 保存vnode，用于后续更新
  container._vnode = vnode;
}

/**
 * 挂载虚拟DOM节点到真实DOM
 * 
 * @param {Object} vnode - 虚拟DOM节点
 * @param {HTMLElement} container - 父容器
 */
function mount(vnode, container) {
  // 创建真实DOM元素
  const el = document.createElement(vnode.tag);
  
  // 保存真实DOM元素到vnode，方便后续更新
  vnode.el = el;

  // 处理属性
  if (vnode.props) {
    for (const key in vnode.props) {
      // 处理事件监听器（以on开头的属性）
      if (key.startsWith('on')) {
        const eventName = key.slice(2).toLowerCase(); // onClick -> click
        el.addEventListener(eventName, vnode.props[key]);
      } else {
        // 处理普通属性
        el.setAttribute(key, vnode.props[key]);
      }
    }
  }

  // 处理子节点
  if (vnode.children) {
    vnode.children.forEach(child => {
      if (typeof child === 'string') {
        // 文本节点：直接创建文本节点
        el.appendChild(document.createTextNode(child));
      } else if (typeof child === 'object') {
        // 子VNode：递归挂载
        mount(child, el);
      }
    });
  }

  // 将元素添加到容器中
  container.appendChild(el);
}

/**
 * 更新虚拟DOM（Vue3风格的diff算法）
 * 
 * Vue3的diff算法优化策略：
 * 1. 静态提升：相同类型的节点可以复用
 * 2. 最小化更新：只更新真正变化的部分
 * 3. 使用key优化列表更新
 * 4. 批量DOM操作，减少重排重绘
 * 
 * @param {Object} oldVnode - 旧的虚拟DOM节点
 * @param {Object} newVnode - 新的虚拟DOM节点
 */
export function patch(oldVnode, newVnode) {
  // 情况1：标签不同，直接替换整个节点
  if (oldVnode.tag !== newVnode.tag) {
    const parent = oldVnode.el.parentNode;
    const nextSibling = oldVnode.el.nextSibling;
    parent.removeChild(oldVnode.el);
    mount(newVnode, parent);
    // 保持位置，插入到原来的位置
    if (nextSibling) {
      parent.insertBefore(newVnode.el, nextSibling);
    } else {
      parent.appendChild(newVnode.el);
    }
    return;
  }

  // 情况2：标签相同，复用DOM节点，只更新变化的部分
  const el = (newVnode.el = oldVnode.el); // 复用DOM元素

  // 步骤1：更新属性（只更新变化的属性）
  patchProps(el, oldVnode.props, newVnode.props);

  // 步骤2：更新子节点（使用优化的diff算法）
  patchChildren(oldVnode, newVnode, el);
}

/**
 * 更新元素的属性（只更新变化的部分）
 * 
 * @param {HTMLElement} el - DOM元素
 * @param {Object} oldProps - 旧的属性对象
 * @param {Object} newProps - 新的属性对象
 */
function patchProps(el, oldProps = {}, newProps = {}) {
  // 遍历新属性，添加或更新
  for (const key in newProps) {
    const oldValue = oldProps[key];
    const newValue = newProps[key];

    // 如果值相同，跳过（避免不必要的DOM操作）
    if (oldValue === newValue) continue;

    if (key.startsWith('on')) {
      // 事件处理：移除旧的事件监听器，添加新的
      const eventName = key.slice(2).toLowerCase();
      if (oldValue) {
        el.removeEventListener(eventName, oldValue);
      }
      el.addEventListener(eventName, newValue);
    } else {
      // 普通属性：直接更新
      el.setAttribute(key, newValue);
    }
  }

  // 遍历旧属性，移除新属性中不存在的属性
  for (const key in oldProps) {
    if (!(key in newProps)) {
      if (key.startsWith('on')) {
        const eventName = key.slice(2).toLowerCase();
        el.removeEventListener(eventName, oldProps[key]);
      } else {
        el.removeAttribute(key);
      }
    }
  }
}

/**
 * 更新子节点（Vue3风格的diff算法）
 * 
 * Vue3的子节点diff算法优化：
 * 1. 双端比较：从两端向中间比较
 * 2. key优化：使用key来快速识别节点
 * 3. 最长递增子序列：最小化DOM移动
 * 
 * 这里实现一个简化但高效的版本：
 * - 支持key的节点复用
 * - 最小化DOM操作
 * 
 * @param {Object} oldVnode - 旧的虚拟DOM节点
 * @param {Object} newVnode - 新的虚拟DOM节点
 * @param {HTMLElement} container - 父容器
 */
function patchChildren(oldVnode, newVnode, container) {
  const oldChildren = oldVnode.children || [];
  const newChildren = newVnode.children || [];

  // 情况1：新子节点是文本节点
  if (typeof newChildren === 'string') {
    if (oldChildren.length > 0) {
      // 清空旧子节点
      container.textContent = '';
    }
    container.textContent = newChildren;
    return;
  }

  // 情况2：旧子节点是文本节点，新子节点是数组
  if (typeof oldChildren === 'string') {
    container.textContent = '';
    newChildren.forEach(child => {
      mount(child, container);
    });
    return;
  }

  // 情况3：都是数组，执行diff算法
  if (Array.isArray(oldChildren) && Array.isArray(newChildren)) {
    // 使用key来优化diff（如果子节点有key）
    if (hasKeyedChildren(newChildren)) {
      patchKeyedChildren(oldChildren, newChildren, container);
    } else {
      // 没有key，使用简单的diff
      patchUnkeyedChildren(oldChildren, newChildren, container);
    }
  }
}

/**
 * 检查子节点是否使用key
 */
function hasKeyedChildren(children) {
  return children.some(child => 
    typeof child === 'object' && child.key !== undefined
  );
}

/**
 * 处理没有key的子节点（简单diff）
 * 
 * @param {Array} oldChildren - 旧的子节点数组
 * @param {Array} newChildren - 新的子节点数组
 * @param {HTMLElement} container - 父容器
 */
function patchUnkeyedChildren(oldChildren, newChildren, container) {
  const oldLength = oldChildren.length;
  const newLength = newChildren.length;
  const commonLength = Math.min(oldLength, newLength);

  // 1. 更新公共长度的节点
  for (let i = 0; i < commonLength; i++) {
    const oldChild = oldChildren[i];
    const newChild = newChildren[i];

    if (typeof oldChild === 'string' && typeof newChild === 'string') {
      // 都是文本节点，直接更新文本内容
      if (oldChild !== newChild) {
        const textNode = container.childNodes[i];
        textNode.textContent = newChild;
      }
    } else if (typeof oldChild === 'object' && typeof newChild === 'object') {
      // 都是VNode，递归patch
      patch(oldChild, newChild);
    } else {
      // 类型不同，替换
      const oldEl = typeof oldChild === 'string' 
        ? container.childNodes[i]
        : oldChild.el;
      container.removeChild(oldEl);
      mount(newChild, container);
    }
  }

  // 2. 如果新数组更长，添加新节点
  if (newLength > oldLength) {
    for (let i = commonLength; i < newLength; i++) {
      mount(newChildren[i], container);
    }
  }

  // 3. 如果旧数组更长，移除多余节点
  if (oldLength > newLength) {
    for (let i = oldLength - 1; i >= commonLength; i--) {
      const oldChild = oldChildren[i];
      const oldEl = typeof oldChild === 'string'
        ? container.childNodes[i]
        : oldChild.el;
      container.removeChild(oldEl);
    }
  }
}

/**
 * 处理有key的子节点（优化的diff算法）
 * 
 * Vue3的keyed diff算法步骤：
 * 1. 建立key到index的映射
 * 2. 双端比较：从两端向中间比较
 * 3. 处理新增和删除的节点
 * 4. 处理需要移动的节点（使用最长递增子序列优化）
 * 
 * 这里实现一个简化版本：
 * - 使用Map建立key映射，快速查找节点
 * - 最小化DOM操作
 * 
 * @param {Array} oldChildren - 旧的子节点数组
 * @param {Array} newChildren - 新的子节点数组
 * @param {HTMLElement} container - 父容器
 */
function patchKeyedChildren(oldChildren, newChildren, container) {
  // 步骤1：建立key到index的映射（新数组）
  const keyToNewIndexMap = new Map();
  for (let i = 0; i < newChildren.length; i++) {
    const child = newChildren[i];
    if (typeof child === 'object' && child.key !== undefined) {
      keyToNewIndexMap.set(child.key, i);
    }
  }

  // 步骤2：建立oldIndex到newIndex的映射，并更新节点
  const oldIndexToNewIndexMap = new Map(); // oldIndex -> newIndex
  const newIndices = new Set(); // 记录已经处理过的新节点索引
  
  // 遍历旧数组，找出对应的新节点位置
  for (let oldIndex = 0; oldIndex < oldChildren.length; oldIndex++) {
    const oldChild = oldChildren[oldIndex];
    
    // 跳过文本节点（文本节点没有key）
    if (typeof oldChild === 'string') {
      continue;
    }

    const oldKey = oldChild.key;
    
    if (oldKey !== undefined) {
      const newIndex = keyToNewIndexMap.get(oldKey);
      
      if (newIndex !== undefined) {
        // 找到对应的新节点，记录映射关系
        oldIndexToNewIndexMap.set(oldIndex, newIndex);
        newIndices.add(newIndex);
        
        const newChild = newChildren[newIndex];
        // 递归patch，更新节点内容（但不移动位置）
        patch(oldChild, newChild);
      } else {
        // 新数组中不存在，移除
        container.removeChild(oldChild.el);
      }
    }
  }

  // 步骤3：移动节点到正确位置（从后往前处理，避免索引变化）
  // 使用最长递增子序列的思想：只移动需要移动的节点
  let lastMovedIndex = -1;
  
  for (let oldIndex = oldChildren.length - 1; oldIndex >= 0; oldIndex--) {
    if (!oldIndexToNewIndexMap.has(oldIndex)) continue;
    
    const newIndex = oldIndexToNewIndexMap.get(oldIndex);
    const oldChild = oldChildren[oldIndex];
    
    // 如果新位置在lastMovedIndex之后，说明顺序正确，不需要移动
    if (newIndex > lastMovedIndex) {
      lastMovedIndex = newIndex;
    } else {
      // 需要移动：找到新位置的下一个兄弟节点
      const anchor = findAnchor(container, newIndex, newChildren, newIndices);
      if (anchor) {
        container.insertBefore(oldChild.el, anchor);
      } else {
        container.appendChild(oldChild.el);
      }
    }
  }

  // 步骤4：处理新增的节点（从前往后插入）
  for (let newIndex = 0; newIndex < newChildren.length; newIndex++) {
    if (!newIndices.has(newIndex)) {
      const newChild = newChildren[newIndex];
      const anchor = findAnchor(container, newIndex, newChildren, newIndices);
      if (anchor) {
        mount(newChild, container);
        container.insertBefore(newChild.el, anchor);
      } else {
        mount(newChild, container);
      }
    }
  }
}

/**
 * 找到指定位置的锚点节点（用于insertBefore）
 */
function findAnchor(container, targetIndex, newChildren, newIndices) {
  // 从targetIndex+1开始向后查找第一个已存在的节点
  for (let i = targetIndex + 1; i < newChildren.length; i++) {
    if (newIndices.has(i)) {
      const child = newChildren[i];
      if (typeof child === 'object' && child.el) {
        return child.el;
      }
    }
  }
  return null;
}

