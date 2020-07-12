// @flow
import React from 'react';
import cx from 'classnames';
import Downshift from "downshift";
import HomePlusIcon from '../icons/HomePlus';
import DeleteCookieIcon from '../icons/DeleteCookie';
import DeleteStorageIcon from '../icons/DeleteStorage';
import FavIconOff from '@material-ui/icons/StarBorder';
import FavIconOn from '@material-ui/icons/Star';
import {iconsColor, lightIconsColor} from '../../constants/colors';
import {getExistingSearchResults,updateExistingUrl,searchUrlUtils} from '../../services/searchUrlSuggestions';
import UrlSearchResults from '../../components/UrlSearchResults';

import commonStyles from '../common.styles.css';
import styles from './style.css';
import {Tooltip} from '@material-ui/core';
import {Icon} from 'flwww';
import debounce from 'lodash/debounce';

type Props = {
  address: string,
  onChange: () => void,
};

type State = {
  address: string,
};

class AddressBar extends React.Component<Props> {
  props: Props;
  state: State;

  constructor(props) {
    super(props);
    this.state = {
      userTypedAddress: props.address,
      previousAddress: props.address,
      finalUrlResult :null,
      previousSearchResults: getExistingSearchResults(),
      menuIsOpen:false
    };
    this.inputRef = React.createRef();
    this._filterExistingUrl = debounce(this._filterExistingUrl, 300);
  }

  static getDerivedStateFromProps(props, state) {
    if (props.address != state.previousAddress) {
      return {
        userTypedAddress: props.address,
        previousAddress: props.address,
      };
    }
    return null;
  }


  render() {
    return (
      <div className={`${styles.addressBarContainer} ${this.state.finalUrlResult ? (this.state.finalUrlResult.length?styles.active:''):''}`}>
         <Downshift
          selectedItem={this.state.userTypedAddress}
          isOpen={this.state.menuIsOpen}
          onOuterClick={() => this.setState({menuIsOpen: false})}
          onStateChange={this._handleUrlChange}>
         {({
            getInputProps,
            getItemProps,
            getMenuProps,
            isOpen,
            selectedItem,
            highlightedIndex,
          }) => (
            <div>
              <input
                {...getInputProps({
                  isOpen,
                  placeholder: "https://your-website.com",
                  value: this.state.userTypedAddress,
                  className: styles.addressInput,
                  ref: this.inputRef,
                  type: "text",
                  id: 'address',
                  name: 'address',
                  onChange: event => this._handleInputChange(event),
                  onKeyDown: event => {
                    if (event.key === "Enter" ) {
                      // Prevent Downshift's default 'Enter' behavior.
                      event.nativeEvent.preventDownshiftDefault = false;
                      this._updateUrlToExistingSearchResult();
                    }
                    if(event.key === "ArrowDown"&&this.state.userTypedAddress){
                      event.nativeEvent.preventDownshiftDefault = false;
                      this._filterExistingUrl();
                    }
                  }
                })}
              />
            <div >
              {((!isOpen|| (this.state.finalUrlResult && !this.state.finalUrlResult.length)) ?  null : (
                <UrlSearchResults
                  divClassName={ cx(styles.searchBarSuggestionsContainer) }
                  listItemUiClassName = { cx(styles.searchBarSuggestionsListUl) }
                  listItemsClassName = { cx(styles.searchBarSuggestionsListItems) }
                  existingSearchResults = { this.state.finalUrlResult }
                  getItemProps = {getItemProps}
                  highlightedIndex = {highlightedIndex}
                  getMenuProps={getMenuProps}
                 />
              ))}
            </div>
          </div>
        )}
        </Downshift>

        <div className={cx(styles.floatingOptionsContainer)}>
          <div
            className={cx(commonStyles.icons, commonStyles.roundIcon, {
              [commonStyles.enabled]: true,
            })}
          >
            <Tooltip
              title={
                this.props.isBookmarked
                  ? 'Remove from Bookmarks'
                  : 'Add to Bookmarks'
              }
            >
              <div
                className={cx(commonStyles.flexAlignVerticalMiddle)}
                onClick={() =>
                  this.props.toggleBookmark(this.state.userTypedAddress)
                }
              >
                <Icon
                  type={this.props.isBookmarked ? 'starFull' : 'star'}
                  color={lightIconsColor}
                />
              </div>
            </Tooltip>
          </div>
          <div
            className={cx(commonStyles.icons, commonStyles.roundIcon, {
              [commonStyles.enabled]: true,
            })}
          >
            <Tooltip title="Delete Storage">
              <div
                className={cx(commonStyles.flexAlignVerticalMiddle)}
                onClick={this.props.deleteStorage}
              >
                <DeleteStorageIcon
                  height={22}
                  width={22}
                  color={iconsColor}
                  padding={5}
                />
              </div>
            </Tooltip>
          </div>
          <div
            className={cx(commonStyles.icons, commonStyles.roundIcon, {
              [commonStyles.enabled]: true,
            })}
          >
            <Tooltip title="Delete Cookies">
              <div
                className={cx(commonStyles.flexAlignVerticalMiddle)}
                onClick={this.props.deleteCookies}
              >
                <DeleteCookieIcon
                  height={22}
                  width={22}
                  color={iconsColor}
                  padding={5}
                />
              </div>
            </Tooltip>
          </div>
          <div
            className={cx(commonStyles.icons, commonStyles.roundIcon, {
              [commonStyles.enabled]:
                this.props.address !== this.props.homepage,
              [commonStyles.disabled]:
                this.props.address == this.props.homepage,
            })}
          >
            <Tooltip title="Set as Homepage">
              <div
                className={cx(commonStyles.flexAlignVerticalMiddle)}
                onClick={this.props.setHomepage}
              >
                <HomePlusIcon
                  height={22}
                  width={22}
                  color={iconsColor}
                  padding={5}
                />
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }

  _handleInputChange = (e) => {
      this.setState({userTypedAddress: e.target.value},()=>{
        this._filterExistingUrl();
      });
  }


  _handleUrlChange = (changes) => {
    let updatedAddress ;
    if(changes?.selectedItem?.url){
      this.setState({
        userTypedAddress : changes.selectedItem.url
      },()=>{
        this._updateUrlToExistingSearchResult();
      })
    }
  }

  _onChange = () => {
    if (!this.state.userTypedAddress) {
      return;
    }
    this.props.onChange &&
      this.props.onChange(this._normalize(this.state.userTypedAddress), true);
  };

  _normalize = address => {
    if (address.indexOf('://') === -1) {
      let protocol = 'https://';
      if (address.startsWith('localhost') || address.startsWith('127.0.0.1')) {
        protocol = 'http://';
      }
      address = `${protocol}${address}`;
    }
    return address;
  };

  _updateUrlToExistingSearchResult = (value) => {
    this.props.onChange(this._normalize(this.state.userTypedAddress), true);
    let updateUrlResult = updateExistingUrl(this.state.previousSearchResults,this._normalize(this.state.userTypedAddress));

    this.setState({
      finalUrlResult:[],
      previousSearchResults: updateUrlResult,
    })
  }


  _filterExistingUrl = () => {
    let finalResult = searchUrlUtils(this.state.previousSearchResults,this.state.userTypedAddress)
    this.setState({finalUrlResult: finalResult,menuIsOpen:true});
  }

}

export default AddressBar;
