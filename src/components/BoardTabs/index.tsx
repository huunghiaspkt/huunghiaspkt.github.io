import React, {type ReactElement, type ReactNode} from 'react';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Admonition from '@theme/Admonition';
import {BOARDS} from '@site/src/data/boards';

type BoardTabProps = {
  /** Board id from src/data/boards.ts. */
  value: string;
  /**
   * Set when this board lacks the hardware the step needs: the tab shows the
   * reason instead of its content, and docs-test reports the step as SKIP.
   */
  unsupported?: string;
  children?: ReactNode;
};

/** One board's content inside <BoardTabs>. The label comes from the registry. */
export function BoardTab({value, unsupported, children}: BoardTabProps): React.JSX.Element {
  if (unsupported) {
    const label = BOARDS.find((b) => b.id === value)?.label ?? value;
    return (
      <TabItem value={value}>
        <Admonition type="note" title={`Not supported on ${label}`}>
          {unsupported}
          {children}
        </Admonition>
      </TabItem>
    );
  }
  return <TabItem value={value}>{children}</TabItem>;
}

/**
 * Board-specific content. Every <BoardTabs> on the site shares one selection,
 * so picking a board once switches all pages to it. Tabs follow the order of
 * src/data/boards.ts, and the first board there is the default.
 */
export default function BoardTabs({children}: {children: ReactNode}): React.JSX.Element {
  const present = React.Children.toArray(children)
    .filter((child): child is ReactElement<BoardTabProps> => React.isValidElement(child))
    .map(({props: {value}}) => value);

  for (const value of present) {
    if (!BOARDS.some((b) => b.id === value)) {
      throw new Error(`<BoardTab value="${value}"> is not in src/data/boards.ts`);
    }
  }

  const values = BOARDS.filter((b) => present.includes(b.id)).map((b) => ({value: b.id, label: b.label}));

  return (
    <Tabs groupId="board" queryString="board" values={values} defaultValue={values[0]?.value}>
      {children}
    </Tabs>
  );
}
