import './NavigationBar.css';
import { type LibraryItem } from './ContentArea';

interface NavigationBarProps {
  showLibrary: boolean;
  onToggleLibrary: () => void;
  libraryItems: LibraryItem[];
}

export default function NavigationBar({ showLibrary, onToggleLibrary, libraryItems }: NavigationBarProps) {
  return (
    <div className="navigation-bar">
      <div className="shell-navigation">
        <div className="expanded">
          <div className="menu-content">
            {/* Chat - Selected when not in library */}
            <div className="nav-item">
              <button className={`nav-button ${!showLibrary ? 'selected' : ''}`} aria-label="Chat" onClick={() => showLibrary && onToggleLibrary()}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 2H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H5V17.5858C5 17.851 5.28215 18 5.5 18C5.62415 18 5.74409 17.9541 5.83579 17.8708L9.70711 14H17C17.5523 14 18 13.5523 18 13V3C18 2.44772 17.5523 2 17 2Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            
            {/* Blocks */}
            <div className="nav-item">
              <button className="nav-button" aria-label="Blocks">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 3H5C3.89543 3 3 3.89543 3 5V6C3 7.10457 3.89543 8 5 8H15C16.1046 8 17 7.10457 17 6V5C17 3.89543 16.1046 3 15 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 11H5C3.89543 11 3 11.8954 3 13V14C3 15.1046 3.89543 16 5 16H15C16.1046 16 17 15.1046 17 14V13C17 11.8954 16.1046 11 15 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            {/* Asset Library - Renamed from Assets */}
            <div className="nav-item">
              <button className={`nav-button ${showLibrary ? 'selected' : ''}`} aria-label="Asset Library" onClick={onToggleLibrary}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="11" height="13" rx="1" stroke="currentColor" strokeWidth="1.5" fill={showLibrary ? "currentColor" : "none"}/>
                  <path d="M6 7H11M6 10H11M6 13H9" stroke={showLibrary ? "white" : "currentColor"} strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M15 6V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {libraryItems.length > 0 && (
                  <span className="library-badge">{libraryItems.length}</span>
                )}
              </button>
            </div>
            
            {/* Calendar */}
            <div className="nav-item">
              <button className="nav-button" aria-label="Calendar">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2.75" y="4.75" width="14.5" height="12.5" rx="1.25" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 8H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M6 3V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M14 3V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}