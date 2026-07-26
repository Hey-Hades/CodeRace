import React from "react";

const SplitHandle = ({ direction, onMouseDown, colors }) => {
  const isVertical = direction === "vertical";

  return (
    <div
      onMouseDown={onMouseDown}
      style={{ "--hover-bg": colors.borderHover }}
      className={`
        bg-transparent transition-colors duration-200 rounded-sm z-10
        hover:bg-[var(--hover-bg)]
        ${isVertical ? "w-1 h-full cursor-col-resize" : "w-full h-1 cursor-row-resize"}
      `}
    />
  );
};

export default SplitHandle;

