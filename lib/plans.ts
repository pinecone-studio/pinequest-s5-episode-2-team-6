// Plan catalog and the bank details shown on the account page.
// The team can change these constants and redeploy; no database change needed.
export interface Plan{
  id:'monthly'|'yearly';
  name:string;        // display name
  months:number;      // how much time one payment buys
  priceMnt:number;    // price in Mongolian tögrög
}

export const PLANS:Plan[]=[
  {id:'monthly',name:'1 сар',months:1,priceMnt:9900},
  {id:'yearly',name:'1 жил',months:12,priceMnt:49000},
];

// The deposit details the user transfers money to. Keep in sync with the
// real account before handing payments to the team.
export const BANK={
  name:'Хаан банк',
  account:'5070586277',
  receiver:'Ням-Од Нямсүрэн',
};
