import React from 'react';

const UrlSearchResults = ({
  divClassName,
  listItemsClassName,
  existingSearchResults,
  activeClass,
  listItemUiClassName,
  getItemProps,
  highlightedIndex,
  getMenuProps
}) => {

  const itemToString=(item)=> {
    return item ? item.url : "";
  }

  return(
     <div className = { divClassName }>
       <ul {...getMenuProps({className: listItemUiClassName})} >
        {existingSearchResults?.map((eachResult,index)=>{
          return(
            <li
             {...getItemProps({
               key: eachResult.url,
               index,
               item: eachResult,
               style: {
                 backgroundColor:
                   highlightedIndex === index && 'lightgray',
               }
             })}>
            {itemToString(eachResult)}
            </li>
          )
        })}
      </ul>
     </div>
  )
}
export default UrlSearchResults;
