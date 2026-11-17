'use client';

import React from 'react';
import Choice, { ChoiceOwnProps } from './Choice';

export type RadioProps = ChoiceOwnProps;

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(function Radio(props, ref) {
  return (
    <Choice
      ref={ref}
      {...props}
      type="radio"
      checkedIcon="radio_button_checked"
      uncheckedIcon="radio_button_unchecked"
    />
  );
});

export default Radio;
