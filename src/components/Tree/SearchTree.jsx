import {Dropdown, Tree} from 'antd';
import React from "react";
import './SearchTree.less';
import {FolderAddOutlined, MoreOutlined} from "@ant-design/icons";
import {FolderCode} from "@icon-park/react";

export default ({treeData: gData, blockNode = true, onAddNode, menu, selectedKeys, onSelect, searchValue, expandedKeys, autoExpandParent, onExpand}) => {
  const loop = data =>
    data.map(item => {
      const index = searchValue && item.title.indexOf(searchValue);
      const title = index > -1 ? (
        <span>
          {item.title.substr(0, index)}
          <span className="site-tree-search-value">{searchValue}</span>
          {item.title.substr(index + searchValue.length)}
        </span>
      ) : (
        <span>{item.title}</span>
      );
      if (item.children) {
        return {title, key: item.key, children: loop(item.children)};
      }
      return {title, key: item.key};
    });

  return (
    <div>
      <Tree
        onExpand={onExpand}
        defaultExpandAll
        blockNode={blockNode}
        selectedKeys={selectedKeys}
        onSelect={onSelect}
        expandedKeys={expandedKeys}
        autoExpandParent={autoExpandParent}
        treeData={loop(gData)}
        titleRender={(node) => {
          return (
            <div className="search-tree-title">
              <span className="search-tree-main">
                <FolderCode theme="outline" size="15" className="folder"/>
                <span className="search-tree-label">{node.title}</span>
              </span>
              <span className="suffixButton">
                <FolderAddOutlined onClick={event => { event.stopPropagation(); onAddNode(node) }} className="icon-left"/>
                <Dropdown overlay={menu(node)} trigger="click">
                  <MoreOutlined className="icon-right" onClick={e => { e.stopPropagation() }}/>
                </Dropdown>
              </span>
            </div>
          )
        }}
      />
    </div>
  );

}
