import { channelLuminance, Rgb, toHexColor, toRgb } from './palette';

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

const LINEAR_SEGMENT_LIMIT = 0.0031308;
const LINEAR_SEGMENT_SLOPE = 12.92;
const GAMMA_SCALE = 1.055;
const GAMMA_OFFSET = 0.055;
const GAMMA_EXPONENT = 2.4;
const CHANNEL_SCALE = 255;

function toEncodedChannel(linear: number): number {
  if (linear <= LINEAR_SEGMENT_LIMIT) {
    return linear * LINEAR_SEGMENT_SLOPE * CHANNEL_SCALE;
  }

  return (GAMMA_SCALE * linear ** (1 / GAMMA_EXPONENT) - GAMMA_OFFSET) * CHANNEL_SCALE;
}

export function toOklch(color: string): Oklch {
  return rgbToOklch(toRgb(color));
}

export function rgbToOklch([red, green, blue]: Rgb): Oklch {
  const linearRed = channelLuminance(red);
  const linearGreen = channelLuminance(green);
  const linearBlue = channelLuminance(blue);

  const long = Math.cbrt(0.4122214708 * linearRed + 0.5363325363 * linearGreen + 0.0514459929 * linearBlue);
  const medium = Math.cbrt(0.2119034982 * linearRed + 0.6806995451 * linearGreen + 0.1073969566 * linearBlue);
  const short = Math.cbrt(0.0883024619 * linearRed + 0.2817188376 * linearGreen + 0.6299787005 * linearBlue);

  const lightness = 0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short;
  const greenRedAxis = 1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short;
  const blueYellowAxis = 0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short;

  return {
    l: lightness,
    c: Math.sqrt(greenRedAxis ** 2 + blueYellowAxis ** 2),
    h: Math.atan2(blueYellowAxis, greenRedAxis),
  };
}

export function fromOklch(l: number, c: number, h: number): string {
  const greenRedAxis = Math.cos(h) * c;
  const blueYellowAxis = Math.sin(h) * c;

  const long = (l + 0.3963377774 * greenRedAxis + 0.2158037573 * blueYellowAxis) ** 3;
  const medium = (l - 0.1055613458 * greenRedAxis - 0.0638541728 * blueYellowAxis) ** 3;
  const short = (l - 0.0894841775 * greenRedAxis - 1.291485548 * blueYellowAxis) ** 3;

  const linear: Rgb = [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ];

  return toHexColor([toEncodedChannel(linear[0]), toEncodedChannel(linear[1]), toEncodedChannel(linear[2])]);
}
