import { useState, useRef, useEffect } from 'react';
import './ShellHeader.css';

const countries = [
  { code: 'US', flag: '🇺🇸', name: 'United States' },
  { code: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: 'FR', flag: '🇫🇷', name: 'France' },
  { code: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: 'CN', flag: '🇨🇳', name: 'China' },
  { code: 'IN', flag: '🇮🇳', name: 'India' },
  { code: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: 'MX', flag: '🇲🇽', name: 'Mexico' },
];

interface AssetType {
  id: string;
  name: string;
  children?: AssetType[];
}

const assetTypes: AssetType[] = [
  { id: 'blog-post', name: 'Blog post' },
  { 
    id: 'instagram', 
    name: 'Instagram',
    children: [
      { id: 'instagram-reel', name: 'Reel' },
      { id: 'instagram-story', name: 'Story' },
      { id: 'instagram-post', name: 'Post' },
    ]
  },
  { id: 'email', name: 'Email' },
  { 
    id: 'website', 
    name: 'Website',
    children: [
      { id: 'website-banner', name: 'Banner' },
      { id: 'website-offer', name: 'Offer' },
      { id: 'website-microsite', name: 'Microsite' },
    ]
  },
  { id: 'sms', name: 'SMS' },
];

interface ShellHeaderProps {
  selectedCountries: string[];
  setSelectedCountries: (countries: string[]) => void;
  selectedAssets: string[];
  setSelectedAssets: (assets: string[]) => void;
  onReset?: () => void;
}

export default function ShellHeader({ 
  selectedCountries, 
  setSelectedCountries, 
  selectedAssets, 
  setSelectedAssets,
  onReset
}: ShellHeaderProps) {
  const [isHoveringLogo, setIsHoveringLogo] = useState(false);

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
  };
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
  const [expandedAssets, setExpandedAssets] = useState<string[]>([]);
  const assetDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
      if (assetDropdownRef.current && !assetDropdownRef.current.contains(event.target as Node)) {
        setIsAssetDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCountry = (code: string) => {
    setSelectedCountries(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const toggleAsset = (id: string) => {
    setSelectedAssets(prev => 
      prev.includes(id) 
        ? prev.filter(a => a !== id)
        : [...prev, id]
    );
  };

  const toggleExpanded = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedAssets(prev => 
      prev.includes(id) 
        ? prev.filter(a => a !== id)
        : [...prev, id]
    );
  };

  const getCountryDropdownLabel = () => {
    if (selectedCountries.length === 0) return 'Select countries';
    if (selectedCountries.length === 1) {
      const country = countries.find(c => c.code === selectedCountries[0]);
      return country ? `${country.flag} ${country.name}` : 'Select countries';
    }
    return `${selectedCountries.length} countries selected`;
  };

  const getAssetDropdownLabel = () => {
    if (selectedAssets.length === 0) return 'All Assets';
    if (selectedAssets.length === 1) {
      // Find the asset name
      for (const asset of assetTypes) {
        if (asset.id === selectedAssets[0]) return asset.name;
        if (asset.children) {
          const child = asset.children.find(c => c.id === selectedAssets[0]);
          if (child) return child.name;
        }
      }
      return 'All Assets';
    }
    return `${selectedAssets.length} assets selected`;
  };
  return (
    <div className="shell-header">
      {/* Main Shell */}
      <div className="shell">
        {/* Hero section with nav toggle and branding */}
        <div className="hero">
          <button className="shell-nav-toggle" aria-label="Toggle navigation">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="3" width="16" height="2" rx="1" fill="currentColor"/>
              <rect x="2" y="9" width="16" height="2" rx="1" fill="currentColor"/>
              <rect x="2" y="15" width="16" height="2" rx="1" fill="currentColor"/>
            </svg>
          </button>
          <button 
            className="app-brand"
            onClick={handleReset}
            onMouseEnter={() => setIsHoveringLogo(true)}
            onMouseLeave={() => setIsHoveringLogo(false)}
            title="Reset application"
          >
            <div className="brand-logo">
              <svg viewBox="0 0 34 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="icon-svg">
                <path d="M27.3103 0H5.87486C2.63027 0 0 2.63027 0 5.87486V26.1251C0 29.3697 2.63027 32 5.87486 32H27.3103C30.5549 32 33.1852 29.3697 33.1852 26.1251V5.87486C33.1852 2.63027 30.5549 0 27.3103 0Z" fill="#EB1000"/>
                <path d="M25.6654 23.8623H23.0302C22.923 23.8646 22.8178 23.8351 22.7269 23.7774C22.636 23.7197 22.5633 23.6362 22.5175 23.5373L19.9363 17.6592C19.929 17.6328 19.9139 17.6095 19.8929 17.5927C19.872 17.5758 19.8462 17.5663 19.8193 17.5656C19.7925 17.5649 19.7662 17.5731 19.7444 17.5889C19.7225 17.6048 19.7063 17.6274 19.6981 17.6534L17.9875 21.8983C17.9783 21.9226 17.975 21.9491 17.978 21.9753C17.981 22.0014 17.9901 22.0264 18.0045 22.0479C18.019 22.0695 18.0384 22.0868 18.0609 22.0985C18.0833 22.1101 18.1082 22.1157 18.1333 22.1147H19.9782C20.0355 22.1147 20.0915 22.1334 20.1376 22.1677C20.1838 22.202 20.2179 22.2502 20.2349 22.3052L21.0345 24.4555C21.051 24.5073 21.0593 24.5619 21.0587 24.6168C21.0582 24.6717 21.0489 24.726 21.0313 24.7775C21.0137 24.829 20.9882 24.8767 20.9561 24.9184C20.924 24.9601 20.886 24.9951 20.8438 25.0217C20.8016 25.0484 20.7562 25.0661 20.7094 25.0741C20.6626 25.0822 20.6154 25.0803 20.5692 25.0687C20.523 25.0571 20.4788 25.0359 20.4389 25.0063C20.3989 24.9767 20.364 24.9392 20.3358 24.8959L14.9758 15.878C14.9704 15.8687 14.9624 15.861 14.9526 15.8556C14.9429 15.8503 14.9318 15.8476 14.9205 15.8476C14.9092 15.8476 14.8982 15.8503 14.8884 15.8556C14.8786 15.861 14.8706 15.8687 14.8652 15.878L9.54419 24.8959C9.50974 24.9571 9.45508 25.0047 9.38985 25.0307C9.32463 25.0567 9.25281 25.0595 9.18572 25.0388C9.11863 25.0181 9.06018 24.9752 9.01933 24.9166C8.97848 24.858 8.95751 24.7872 8.95988 24.7152V24.6819C8.95799 24.636 8.96381 24.5902 8.97707 24.5465L14.2722 10.8048C14.3303 10.6735 14.4245 10.5618 14.5437 10.4826C14.6629 10.4034 14.8021 10.3601 14.9447 10.3577H18.0103C18.1531 10.3601 18.2924 10.4034 18.4117 10.4827C18.531 10.5619 18.6252 10.6737 18.6833 10.8051L23.9783 24.5467C23.9921 24.5905 23.9983 24.6365 23.9968 24.6826C23.9954 24.7287 23.9862 24.7742 23.9699 24.8171C23.9536 24.86 23.9304 24.8996 23.9012 24.9338C23.872 24.968 23.8375 24.9963 23.799 25.0174C23.7606 25.0384 23.7189 25.0519 23.6761 25.0571C23.6332 25.0623 23.5901 25.0591 23.5484 25.0477C23.5067 25.0363 23.4673 25.0169 23.4322 24.9905C23.3972 24.9641 23.3672 24.9312 23.3438 24.8936L20.6825 19.9906C20.6526 19.9343 20.6059 19.8886 20.5488 19.8599C20.4917 19.8311 20.4269 19.8207 20.3632 19.8299H17.9239C17.8906 19.8319 17.8587 19.8435 17.8318 19.8635C17.8049 19.8835 17.7841 19.9111 17.7717 19.9429L16.8542 22.2732C16.8471 22.291 16.8435 22.3101 16.8437 22.3294C16.8439 22.3486 16.848 22.3677 16.8556 22.3853C16.8632 22.4029 16.874 22.4186 16.8877 22.4316C16.9013 22.4446 16.9174 22.4545 16.935 22.4608L22.4937 23.5373C22.5395 23.6362 22.6122 23.7197 22.7031 23.7774C22.7941 23.8351 22.8992 23.8646 23.0064 23.8623H25.6654Z" fill="white"/>
              </svg>
            </div>
            <p className="product-name">{isHoveringLogo ? 'Reset' : 'Adobe Experience Cloud'}</p>
          </button>
        </div>

        {/* Actions section */}
        <div className="actions">
          {/* Search */}
          <div className="search-container">
            <div className="search-field">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="search-icon">
                <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search Experience Cloud (⌘+/)" 
                className="search-input"
              />
            </div>
          </div>

          {/* Org Switcher */}
          <button className="org-switcher-btn">
            Adobe Inc.
          </button>

          {/* Global Actions */}
          <div className="global-actions">
            <div className="divider"></div>
            
            {/* Help Center */}
            <button className="icon-button" aria-label="Help center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 14v.5M10 7.5c0-1.1.9-2 2-2s2 .9 2 2c0 1.1-.9 2-2 2h0c-.6 0-1 .4-1 1v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Notifications */}
            <button className="icon-button" aria-label="Notifications">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3v1M4 17h12M6.5 17v-4.5c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5V17M8 4.5c0-1.1.9-2 2-2s2 .9 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {/* App Switcher */}
            <button className="icon-button" aria-label="App switcher">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="12" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="3" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <rect x="12" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </button>

            {/* Profile Avatar */}
            <div className="profile">
              <div className="avatar">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="16" fill="#E0E0E0"/>
                  <circle cx="16" cy="13" r="5" fill="#757575"/>
                  <path d="M6 28C6 22 10 18 16 18C22 18 26 22 26 28" fill="#757575"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Header */}
      <div className="sub-header">
        <div className="sub-header-left">
          <button className="back-button" aria-label="Go back">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <input 
            type="text" 
            className="project-title-input" 
            defaultValue="Project title"
            aria-label="Project title"
          />
        </div>
        <div className="sub-header-right">
          {/* Country Dropdown */}
          <div className="dropdown-with-label" ref={countryDropdownRef}>
            <div className="dropdown-label">Location</div>
            <div className="dropdown">
              <button 
                className="dropdown-button"
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                aria-expanded={isCountryDropdownOpen}
              >
                <span className="dropdown-text">{getCountryDropdownLabel()}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="dropdown-chevron">
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {isCountryDropdownOpen && (
                <div className="dropdown-menu">
                  {countries.map((country) => (
                    <label
                      key={country.code}
                      className="dropdown-item checkbox-item"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCountries.includes(country.code)}
                        onChange={() => toggleCountry(country.code)}
                        className="dropdown-checkbox"
                      />
                      <span className="dropdown-item-text">{country.flag} {country.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Asset Dropdown */}
          <div className="dropdown-with-label" ref={assetDropdownRef}>
            <div className="dropdown-label">Asset</div>
            <div className="dropdown">
              <button 
                className="dropdown-button"
                onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                aria-expanded={isAssetDropdownOpen}
              >
                <span className="dropdown-text">{getAssetDropdownLabel()}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="dropdown-chevron">
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            {isAssetDropdownOpen && (
              <div className="dropdown-menu">
                {assetTypes.map((asset) => (
                  <div key={asset.id}>
                    <label className="dropdown-item checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedAssets.includes(asset.id)}
                        onChange={() => toggleAsset(asset.id)}
                        className="dropdown-checkbox"
                      />
                      <span className="dropdown-item-text">{asset.name}</span>
                      {asset.children && (
                        <button
                          className="expand-button"
                          onClick={(e) => toggleExpanded(asset.id, e)}
                          aria-label={expandedAssets.includes(asset.id) ? 'Collapse' : 'Expand'}
                        >
                          <svg 
                            width="10" 
                            height="10" 
                            viewBox="0 0 10 10" 
                            fill="none"
                            className={`expand-icon ${expandedAssets.includes(asset.id) ? 'expanded' : ''}`}
                          >
                            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </label>
                    {asset.children && expandedAssets.includes(asset.id) && (
                      <div className="nested-items">
                        {asset.children.map((child) => (
                          <label key={child.id} className="dropdown-item checkbox-item nested">
                            <input
                              type="checkbox"
                              checked={selectedAssets.includes(child.id)}
                              onChange={() => toggleAsset(child.id)}
                              className="dropdown-checkbox"
                            />
                            <span className="dropdown-item-text">{child.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}