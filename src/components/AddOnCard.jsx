// import React, { useState } from "react";
// import AddOnDetailModal from "./AddOnDetailModal";

// export default function AddOnCard({
//   item,
//   selected,
//   onIncrement,
//   onDecrement,
//   qty,
// }) {
//   const [showModal, setShowModal] = useState(false);

//   return (
//     <>
//       <div
//         className={`border rounded-2xl bg-white shadow-sm flex flex-col justify-between transition ${
//           selected ? "border-purple-700 ring-2 ring-purple-200" : ""
//         }`}
//       >
//         <img
//           src={item.image}
//           alt={item.title}
//           className="rounded-t-2xl h-[180px] w-full object-cover"
//         />
//         <div className="p-5 flex-1 flex flex-col">
//           <div className="mb-2">
//             <h3 className="font-bold text-lg mb-0.5">{item.title}</h3>
//             <div className="mb-1.5 text-gray-700 text-sm">{item.subtitle}</div>
//             <button
//               className="text-purple-700 text-sm underline  font-semibold mb-2 cursor-pointer"
//               onClick={() => setShowModal(true)}
//             >
//               View details
//             </button>
//             {item.nonRefundable && (
//               <span className="text-xs  bg-red-100 text-red-500 font-medium rounded px-2 m-4 py-1">
//                 Non-Refundable
//               </span>
//             )}
//           </div>
//           <div className="flex items-center justify-between gap-4 mt-auto mb-2">
//             <div>
//               {item.oldPrice && (
//                 <span className="text-gray-400 text-xs line-through mr-2 font-medium">
//                   ₹{item.oldPrice}
//                 </span>
//               )}
//               <span className="text-purple-700 font-bold text-lg">
//                 ₹{item.price}
//               </span>
//               <span className="text-xs ml-1 font-medium text-gray-500">
//                 {item.unit}
//               </span>
//             </div>
//             <div className="flex items-center border rounded-lg px-1.5">
//               <button
//                 className="w-7 h-7 flex items-center justify-center rounded hover:bg-purple-100 text-lg font-bold disabled:opacity-30"
//                 onClick={() => onDecrement(item)}
//                 disabled={qty === 0}
//                 type="button"
//               >
//                 -
//               </button>
//               <span className="mx-1 min-w-[24px] text-base text-center">
//                 {qty}
//               </span>
//               <button
//                 className="w-7 h-7 flex items-center justify-center rounded hover:bg-purple-100 text-lg font-bold"
//                 onClick={() => onIncrement(item)}
//                 type="button"
//               >
//                 +
//               </button>
//             </div>
//           </div>
//           <div className="text-xs text-gray-400 mt-2">
//             Excluding taxes &amp; fees
//           </div>
//         </div>
//       </div>
//       <AddOnDetailModal
//         open={showModal}
//         onClose={() => setShowModal(false)}
//         addon={item}
//         isSelected={selected}
//         onAdd={onIncrement}
//         onRemove={onDecrement}
//       />
//     </>
//   );
// }
