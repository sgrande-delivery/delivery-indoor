'use client';

import React from 'react';
import Choice, { ChoiceOwnProps } from './Choice';

export type CheckboxProps = ChoiceOwnProps;

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(props, ref) {
  return (
    <Choice ref={ref} {...props} type="checkbox" checkedIcon="check_box" uncheckedIcon="check_box_outline_blank" />
  );
});

export default Checkbox;
