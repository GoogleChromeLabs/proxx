import { Component, h } from "preact";
import { Cell, Tag } from "../../../../../gamelogic/types.js";
import { bind } from "../../../../../utils/bind.js";

interface State {}

interface Props {
  cell: Cell;
  onClick(action: Action): void;
}

interface ItemProps {
  cell: Cell;
  onUnrevealedClick(event: MouseEvent): void;
  onTouchingClick(event: MouseEvent): void;
}

export const enum Action {
  Reveal,
  Flag,
  Unflag,
  RevealSurrounding
}

// tslint:disable-next-line:variable-name
const Item = ({ cell, onUnrevealedClick, onTouchingClick }: ItemProps) => {
  if (!cell.revealed) {
    return (
      <button onClick={onUnrevealedClick}>
        {cell.tag === Tag.Flag ? "Flagged" : "Not revealed"}
      </button>
    );
  }
  if (cell.hasMine) {
    return <div>Mine</div>;
  }
  if (cell.touching) {
    return <button onClick={onTouchingClick}>{cell.touching}</button>;
  }

  return <div />;
};

export default class GridCell extends Component<Props, State> {
  shouldComponentUpdate(nextProps: Props) {
    return this.props.cell !== nextProps.cell;
  }

  @bind
  onUnrevealedClick(event: MouseEvent) {
    if (event.shiftKey) {
      this.props.onClick(
        this.props.cell.tag === Tag.Flag ? Action.Unflag : Action.Flag
      );
      return;
    }

    // Don't allow clicking on flagged squares
    if (this.props.cell.tag === Tag.Flag) {
      return;
    }

    this.props.onClick(Action.Reveal);
  }

  @bind
  onTouchingClick(event: MouseEvent) {
    if (!event.shiftKey) {
      return;
    }
    this.props.onClick(Action.RevealSurrounding);
  }

  render({ cell }: Props) {
    return (
      <td>
        <Item
          cell={cell}
          onUnrevealedClick={this.onUnrevealedClick}
          onTouchingClick={this.onTouchingClick}
        />
      </td>
    );
  }
}
