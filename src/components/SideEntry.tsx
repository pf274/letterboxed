import { TextField } from "@mui/material";
import { useState } from "react";


export default function SideEntry({onChange, name, orientation} : {onChange: (newSideValue: string) => any, name: string, orientation: 'horizontal' | 'vertical'}) {
  const [side, setSide] = useState<string>('');
  return (
    <TextField
      placeholder={name}
      value={side}
      fullWidth
      onChange={(event) => {
        if (orientation == 'vertical') {
          const newLength = event.target.value.replace(/\n/g, '').length;
          const newValue = event.target.value.replace(/\n/g, '').split('').join('\n');
          if (newLength <= 3) {
            setSide(newValue);
            onChange(newValue);
          }
        } else {
          const newValue = event.target.value;
          if (newValue.length <= 3) {
            setSide(newValue);
            onChange(newValue);
          }
        }
      }}
      multiline={orientation == 'vertical'}
      style={{width: orientation == 'vertical' ? '3em' : '10em'}}
    />
  )
}