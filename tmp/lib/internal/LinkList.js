/**
 * @description 构造JS层的LinkList类数据结构(适用于大批量的append和删除操作，时间复杂度为o(n))
 */
'use strict';

class LinkList {
    //构造函数，初始化链表的Head结点
    constructor(head) {
        head = head && typeof head === 'object' && head || {};
        //把头结点的前(_idlePrev)后(_idleNext)结点指向Head结点本身
        head._idlePrev = head;
        head._idleNext = head;

        this._headNode = head;
    }

    //获取链表第一个元素的方法，如果没有第一个元素则返回null
    peek() {
        if (this._headNode._idleNext === this._headNode) {
            return null;
        }
        return this._headNode._idleNext;
    }

    //删除并返回链表的第一个元素，如果没有第一个元素则返回null
    shift() {
        const first = this._headNode._idleNext;
        if (first === this._headNode) {
            return null;
        }
        LinkList.remove(first);
        return first;
    }

    //将新元素挂载到当前链表的最后一环
    append(item) {
        if (item._idlePrev || item._idleNext) {
            LinkList.remove(item);
        }

        //挂载元素的前指针指向链表的原最后一个元素，后指针指向链表head
        item._idlePrev = this._headNode._idlePrev;
        item._idleNext = this._headNode;

        //链表的原最后一个元素的后指针指向挂载元素，链表的head的前指针指向挂载元素
        this._headNode._idlePrev._idleNext = item;
        this._headNode._idlePrev = item;
    }

    //判断当前链表是否为空
    isEmpty() {
        return this._headNode._idleNext === this._headNode;
    }

    //静态方法，移除链表元素
    static remove(item) {
        //如果当前删除节点存在前指针，则将后指针指向的节点元素的前指针指向删除节点前一个元素
        if (item._idlePrev) {
            item._idleNext._idlePrev = item._idlePrev;
        }
        //如果当前删除节点存在后指针，则将前指针指向的节点元素的后指针指向删除节点后一个元素
        if (item._idleNext) {
            item._idlePrev._idleNext = item._idleNext;
        }

        //把删除元素的前后指针置为空，等待GC
        item._idlePrev = null;
        item._idleNext = null;
    }

}

module.exports = LinkList;