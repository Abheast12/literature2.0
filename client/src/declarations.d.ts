declare module '@letele/playing-cards' {
  import * as React from 'react';

  // Define a type for the card components (e.g., Sa, Hk, J1, etc.)
  // Each card is an SVG component.
  type CardSvgComponent = React.FC<React.SVGProps<SVGSVGElement>>;

  // Declare the known card components provided by the library.
  // This is not exhaustive but covers common ones and jokers/backs.
  // The library exports them by names like Sa, Hk, Dt, C2, J1, J2, B1, B2.
  export const Sa: CardSvgComponent;
  export const Sk: CardSvgComponent;
  export const Sq: CardSvgComponent;
  export const Sj: CardSvgComponent;
  export const S10: CardSvgComponent;
  // Add other Spades as needed (S2-S9)
  export const S9: CardSvgComponent;
  export const S2: CardSvgComponent;

  export const Ha: CardSvgComponent;
  export const Hk: CardSvgComponent;
  export const Hq: CardSvgComponent;
  export const Hj: CardSvgComponent;
  export const H10: CardSvgComponent;
  // Add other Hearts

  export const Ca: CardSvgComponent;
  export const Ck: CardSvgComponent;
  export const Cq: CardSvgComponent;
  export const Cj: CardSvgComponent;
  export const C10: CardSvgComponent;
  // Add other Clubs

  export const Da: CardSvgComponent;
  export const Dk: CardSvgComponent;
  export const Dq: CardSvgComponent;
  export const Dj: CardSvgComponent;
  export const D10: CardSvgComponent;
  // Add other Diamonds

  export const J1: CardSvgComponent; // Joker 1
  export const J2: CardSvgComponent; // Joker 2

  export const B1: CardSvgComponent; // Card Back 1
  export const B2: CardSvgComponent; // Card Back 2

  // If the library allows accessing all cards via an object (e.g., deck['Sa'])
  // you might need a more dynamic type, but explicitly listing helps with auto-completion.
  // For dynamic access like deck[cardNameString], an index signature might be needed:
  // const deck: { [cardName: string]: CardSvgComponent | undefined };
  // export default deck;
} 