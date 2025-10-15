import { useState, useRef, useEffect } from 'react';
import './ContentArea.css';

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

const assetTypes = [
  { id: 'blog-post', name: 'Blog post', disabled: false },
  { id: 'instagram', name: 'Instagram', disabled: true },
  { id: 'instagram-reel', name: 'Reel', disabled: false },
  { id: 'instagram-story', name: 'Story', disabled: false },
  { id: 'instagram-post', name: 'Post', disabled: false },
  { id: 'email', name: 'Email', disabled: false },
  { id: 'website', name: 'Website', disabled: false },
  { id: 'website-banner', name: 'Banner', disabled: false },
  { id: 'website-offer', name: 'Offer', disabled: false },
  { id: 'website-microsite', name: 'Microsite', disabled: false },
  { id: 'sms', name: 'SMS', disabled: true },
];

// Languages by country
const languagesByCountry: { [key: string]: string[] } = {
  'US': ['English (US)', 'Spanish'],
  'GB': ['English (UK)'],
  'CA': ['English (CA)', 'French (CA)'],
  'AU': ['English (AU)'],
  'DE': ['German', 'English'],
  'FR': ['French', 'English'],
  'ES': ['Spanish', 'Catalan', 'Basque', 'Galician'],
  'IT': ['Italian', 'English'],
  'JP': ['Japanese', 'English'],
  'CN': ['Chinese (Simplified)', 'English'],
  'IN': ['Hindi', 'English', 'Tamil', 'Telugu', 'Bengali'],
  'BR': ['Portuguese (BR)', 'English'],
  'MX': ['Spanish (MX)', 'English'],
};

interface GeneratedContent {
  id: string;
  prompt: string;
  country: string;
  contentType: string;
  language: string;
  content: string;
  timestamp: Date;
}

interface Variant {
  id: string;
  asset: string;
  country: string;
  assetName: string;
  countryName: string;
  variantNumber: number;
  content: GeneratedContent;
}

interface ContentAreaProps {
  selectedCountries: string[];
  selectedAssets: string[];
  generatedContent: GeneratedContent | null;
  isGenerating: boolean;
  onRegenerateContent: (prompt: string, country: string, contentType: string, language: string) => void;
  onAddToLibrary?: (items: LibraryItem[]) => void;
  highlightedExcerpt?: { start: number; end: number } | null;
}

export interface LibraryItem {
  id: string;
  title: string;
  country: string;
  countryName: string;
  assetType: string;
  assetTypeName: string;
  language: string;
  content: GeneratedContent;
  timestamp: Date;
}

export default function ContentArea({ selectedCountries, selectedAssets, generatedContent, isGenerating, onRegenerateContent, onAddToLibrary, highlightedExcerpt }: ContentAreaProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCombination, setSelectedCombination] = useState<string>('');
  const [isTranslationEnabled, setIsTranslationEnabled] = useState(false);
  const [hoveredSentence, setHoveredSentence] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [translationCache, setTranslationCache] = useState<{ [key: string]: string }>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  
  // Translate text using Google Translate API with auto language detection
  const translateWithGoogleTranslate = async (text: string): Promise<string> => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY || '';
      
      if (!apiKey) {
        console.warn('Google Translate API key not found. Using mock translation.');
        // Return mock translation for demo - simulate a delay
        await new Promise(resolve => setTimeout(resolve, 300));
        // Just return the text as-is to indicate it would be translated
        return `[EN] ${text}`;
      }
      
      // Use Google Translate API with auto language detection
      const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: 'en',
          format: 'text'
          // source is omitted to enable auto-detection
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Translation API error:', response.status, errorData);
        throw new Error(`Translation failed: ${response.status}`);
      }

      const data = await response.json();
      const translatedText = data.data?.translations?.[0]?.translatedText || text;
      const detectedLanguage = data.data?.translations?.[0]?.detectedSourceLanguage;
      
      console.log('Detected language:', detectedLanguage, '| Translation:', translatedText);
      
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      // Return mock translation as fallback
      await new Promise(resolve => setTimeout(resolve, 300));
      return `✓ English: ${text}`;
    }
  };

  // Handle sentence hover for translation
  const handleSentenceHover = async (sentence: string) => {
    if (isTranslationEnabled) {
      console.log('Hovering over sentence:', sentence);
      setHoveredSentence(sentence);
      
      // Check if translation is already cached
      if (translationCache[sentence]) {
        console.log('Using cached translation');
        setTranslatedText(translationCache[sentence]);
        setIsTranslating(false);
        return;
      }
      
      // Show loading state
      console.log('Starting translation...');
      setIsTranslating(true);
      setTranslatedText('');
      
      // Translate the sentence using Google Translate with auto language detection
      const translation = await translateWithGoogleTranslate(sentence);
      console.log('Translation result:', translation);
      
      // Cache the translation
      setTranslationCache(prev => ({
        ...prev,
        [sentence]: translation
      }));
      
      setTranslatedText(translation);
      setIsTranslating(false);
    }
  };
  
  const handleSentenceLeave = () => {
    setHoveredSentence(null);
    setIsTranslating(false);
    setTranslatedText('');
  };
  
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English (US)');
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  
  const [drilldownAssetId, setDrilldownAssetId] = useState<string | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  
  const [generatedImages, setGeneratedImages] = useState<{ [key: string]: string }>({});
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);

  // Scroll to highlighted excerpt when it changes
  useEffect(() => {
    if (highlightedExcerpt && contentScrollRef.current) {
      // Add a small delay to ensure the highlighting is applied first
      const scrollTimeout = setTimeout(() => {
        const highlightedElement = contentScrollRef.current?.querySelector('.highlighted-excerpt');
        if (highlightedElement) {
          // Scroll to the element with smooth behavior
          highlightedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100); // Small delay to ensure DOM is updated

      return () => clearTimeout(scrollTimeout);
    }
  }, [highlightedExcerpt]);
  const [pinecoreImages, setPinecoreImages] = useState<string[]>([]);
  
  // Long press state for Add to Library button
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const longPressThreshold = 800; // 800ms for long press

  // Load Pinecore images on component mount
  useEffect(() => {
    const loadPinecoreImages = async () => {
      try {
        // Try to load images from public/pinecore-images folder
        // This uses import.meta.glob to dynamically import all images
        const imageModules = import.meta.glob('/public/pinecore-images/*.{png,jpg,jpeg,gif,webp,svg}');
        const imagePaths = Object.keys(imageModules).map(path => path.replace('/public', ''));
        
        if (imagePaths.length > 0) {
          setPinecoreImages(imagePaths);
          console.log(`Loaded ${imagePaths.length} Pinecore images:`, imagePaths);
        } else {
          console.log('No Pinecore images found. Add images to public/pinecore-images/ folder.');
        }
      } catch (error) {
        console.log('Could not load Pinecore images:', error);
      }
    };
    
    loadPinecoreImages();
  }, []);

  // Function to intelligently select default image based on country and content type
  const getDefaultImage = (country: string, contentType: string): string | null => {
    if (pinecoreImages.length === 0) return null;

    // Define keywords for matching images
    const countryKeywords: { [key: string]: string[] } = {
      'US': ['united states', 'warm beer', 'social gathering'],
      'GB': ['united kingdom', 'podcast', 'hiking'],
      'CA': ['hiking', 'wilderness', 'adults'],
      'AU': ['hiking', 'wilderness', 'adults'],
      'DE': ['oktoberfest', 'beer', 'germany'],
      'FR': ['social gathering', 'party', 'celebration'],
      'ES': ['party', 'celebration', 'social'],
      'IT': ['social', 'gathering', 'party'],
      'JP': ['japan', 'cherry blossom', 'tea'],
      'CN': ['beijing', 'marathon', 'china'],
      'IN': ['indian', 'celebrity', 'podcast'],
      'BR': ['brazil', 'beach party', 'tropical'],
      'MX': ['party', 'celebration', 'social'],
    };

    const contentKeywords: { [key: string]: string[] } = {
      'blog-post': ['hiking', 'wilderness', 'adults', 'family'],
      'instagram-reel': ['party', 'beach', 'celebration', 'social'],
      'instagram-story': ['party', 'beach', 'celebration'],
      'instagram-post': ['party', 'beach', 'social'],
      'instagram': ['party', 'beach', 'social'],
    };

    // Get keywords for current country and content type
    const countryWords = countryKeywords[country] || [];
    const contentWords = contentKeywords[contentType] || ['energy drink', 'tea', 'coffee'];

    // Try to find image matching both country and content type
    for (const cWord of countryWords) {
      for (const ctWord of contentWords) {
        const match = pinecoreImages.find(img => 
          img.toLowerCase().includes(cWord.toLowerCase()) && 
          img.toLowerCase().includes(ctWord.toLowerCase())
        );
        if (match) {
          console.log(`Found perfect match for ${country} + ${contentType}:`, match);
          return match;
        }
      }
    }

    // Try country-specific image
    for (const cWord of countryWords) {
      const match = pinecoreImages.find(img => img.toLowerCase().includes(cWord.toLowerCase()));
      if (match) {
        console.log(`Found country match for ${country}:`, match);
        return match;
      }
    }

    // Try content-type specific image
    for (const ctWord of contentWords) {
      const match = pinecoreImages.find(img => img.toLowerCase().includes(ctWord.toLowerCase()));
      if (match) {
        console.log(`Found content type match for ${contentType}:`, match);
        return match;
      }
    }

    // Fallback to first available image
    console.log('Using fallback image');
    return pinecoreImages[0];
  };

  // Auto-generate default image when content is generated
  useEffect(() => {
    if (generatedContent && pinecoreImages.length > 0) {
      const defaultImageId = `default-${generatedContent.id}`;
      
      // Only set default image if no image has been generated yet for this content
      if (!generatedImages[defaultImageId]) {
        const defaultImage = getDefaultImage(generatedContent.country, generatedContent.contentType);
        if (defaultImage) {
          setGeneratedImages(prev => ({
            ...prev,
            [defaultImageId]: defaultImage
          }));
          console.log(`Auto-selected default image for ${generatedContent.country} + ${generatedContent.contentType}:`, defaultImage);
        }
      }
    }
  }, [generatedContent, pinecoreImages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate combinations of assets and countries
  const generateCombinations = () => {
    const combinations: Array<{ asset: string; country: string; assetName: string; countryName: string }> = [];
    
    selectedAssets.forEach(assetId => {
      const asset = assetTypes.find(a => a.id === assetId);
      if (asset) {
        selectedCountries.forEach(countryCode => {
          const country = countries.find(c => c.code === countryCode);
          if (country) {
            combinations.push({
              asset: assetId,
              country: countryCode,
              assetName: asset.name,
              countryName: country.name,
            });
          }
        });
      }
    });
    
    return combinations;
  };

  // Group combinations by asset type
  const groupCombinationsByAsset = () => {
    const grouped: { [key: string]: Array<{ asset: string; country: string; assetName: string; countryName: string }> } = {};
    
    combinations.forEach(combo => {
      if (!grouped[combo.asset]) {
        grouped[combo.asset] = [];
      }
      grouped[combo.asset].push(combo);
    });
    
    return grouped;
  };

  const combinations = generateCombinations();
  const groupedCombinations = groupCombinationsByAsset();

  const handleAssetClick = (assetId: string) => {
    setDrilldownAssetId(assetId);
  };

  const handleBackClick = () => {
    setDrilldownAssetId(null);
  };

  // Set default selected combination
  useEffect(() => {
    if (combinations.length > 0 && !selectedCombination) {
      setSelectedCombination(`${combinations[0].asset}-${combinations[0].country}`);
    }
  }, [combinations, selectedCombination]);

  const getSelectedLabel = () => {
    if (!selectedCombination) return 'Select content';
    const selected = combinations.find(c => `${c.asset}-${c.country}` === selectedCombination);
    return selected ? `${selected.assetName} - ${selected.countryName}` : 'Select content';
  };

  // Cycle through combinations
  const handlePreviousCombination = () => {
    if (combinations.length <= 1) return;
    const currentIndex = combinations.findIndex(c => `${c.asset}-${c.country}` === selectedCombination);
    const previousIndex = currentIndex <= 0 ? combinations.length - 1 : currentIndex - 1;
    const previousCombo = combinations[previousIndex];
    setSelectedCombination(`${previousCombo.asset}-${previousCombo.country}`);
  };

  const handleNextCombination = () => {
    if (combinations.length <= 1) return;
    const currentIndex = combinations.findIndex(c => `${c.asset}-${c.country}` === selectedCombination);
    const nextIndex = currentIndex >= combinations.length - 1 ? 0 : currentIndex + 1;
    const nextCombo = combinations[nextIndex];
    setSelectedCombination(`${nextCombo.asset}-${nextCombo.country}`);
  };

  // Keyboard navigation for cycling through combinations
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys when no input/textarea is focused and dropdowns are closed
      const target = event.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      if (isInputFocused || isDropdownOpen || isLanguageDropdownOpen) return;
      
      // Only handle if we have multiple combinations and content is generated
      if (combinations.length > 1 && selectedCombination && generatedContent) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          handlePreviousCombination();
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          handleNextCombination();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [combinations, selectedCombination, isDropdownOpen, isLanguageDropdownOpen, generatedContent]);

  // Get available languages for the selected country
  const getAvailableLanguages = () => {
    if (!selectedCombination) return ['English (US)'];
    const selected = combinations.find(c => `${c.asset}-${c.country}` === selectedCombination);
    if (!selected) return ['English (US)'];
    return languagesByCountry[selected.country] || ['English (US)'];
  };

  // Update selected language when combination changes
  useEffect(() => {
    if (selectedCombination) {
      const availableLanguages = getAvailableLanguages();
      if (!availableLanguages.includes(selectedLanguage)) {
        setSelectedLanguage(availableLanguages[0]);
      }
    }
  }, [selectedCombination]);

  // Regenerate content when country, asset type, or language changes
  useEffect(() => {
    if (generatedContent && selectedCombination && !selectedCombination.includes('-var-')) {
      const selected = combinations.find(c => `${c.asset}-${c.country}` === selectedCombination);
      if (selected && (selected.country !== generatedContent.country || selected.asset !== generatedContent.contentType || selectedLanguage !== generatedContent.language)) {
        // Regenerate with new country/asset/language
        console.log('Regenerating content - Country:', selected.country, 'Asset:', selected.asset, 'Language:', selectedLanguage);
        onRegenerateContent(generatedContent.prompt, selected.country, selected.asset, selectedLanguage);
      }
    }
  }, [selectedCombination, selectedLanguage]);

  const handleCreateVariant = () => {
    if (!generatedContent || !selectedCombination) return;

    const selected = combinations.find(c => `${c.asset}-${c.country}` === selectedCombination);
    if (!selected) return;

    // Find the highest variant number for this combination
    const existingVariants = variants.filter(v => 
      v.asset === selected.asset && v.country === selected.country
    );
    const nextVariantNumber = existingVariants.length + 2; // Start from 2 (original is 1)

    const newVariant: Variant = {
      id: `${selected.asset}-${selected.country}-var-${Date.now()}`,
      asset: selected.asset,
      country: selected.country,
      assetName: selected.assetName,
      countryName: selected.countryName,
      variantNumber: nextVariantNumber,
      content: { ...generatedContent },
    };

    setVariants(prev => [...prev, newVariant]);
    setSelectedCombination(newVariant.id);
  };

  // Long press handlers for Add to Library
  const handleLongPressStart = () => {
    setIsLongPressing(true);
    longPressTimer.current = window.setTimeout(() => {
      handleAddToLibrary();
    }, longPressThreshold);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsLongPressing(false);
  };

  const handleAddToLibrary = () => {
    if (!generatedContent || !onAddToLibrary) return;

    // Collect all generated content (main + variants)
    const libraryItems: LibraryItem[] = [];

    // Add main content
    const selected = combinations.find(c => `${c.asset}-${c.country}` === selectedCombination);
    if (selected) {
      libraryItems.push({
        id: `lib-${generatedContent.id}`,
        title: generatedContent.prompt,
        country: selected.country,
        countryName: selected.countryName,
        assetType: selected.asset,
        assetTypeName: selected.assetName,
        language: generatedContent.language,
        content: generatedContent,
        timestamp: new Date(),
      });
    }

    // Add all variants
    variants.forEach(variant => {
      libraryItems.push({
        id: `lib-${variant.id}`,
        title: variant.content.prompt,
        country: variant.country,
        countryName: variant.countryName,
        assetType: variant.asset,
        assetTypeName: variant.assetName,
        language: variant.content.language,
        content: variant.content,
        timestamp: new Date(),
      });
    });

    onAddToLibrary(libraryItems);
    console.log(`Added ${libraryItems.length} items to library`);
  };

  const handleGenerateImage = async (keywords: string[], imageId: string) => {
    console.log('Generating image with keywords:', keywords, 'for imageId:', imageId);
    
    // Check if Pinecore images are available
    if (pinecoreImages.length === 0) {
      console.error('No Pinecore images found. Please add images to public/pinecore-images/ folder.');
      alert('No Pinecore images available. Please add images to the public/pinecore-images/ folder.');
      return;
    }
    
    setGeneratingImage(imageId);
    
    // Simulate API call delay
    setTimeout(() => {
      // Pick a random image from Pinecore images
      const randomIndex = Math.floor(Math.random() * pinecoreImages.length);
      const imageUrl = pinecoreImages[randomIndex];
      console.log(`Using Pinecore image ${randomIndex + 1} of ${pinecoreImages.length}:`, imageUrl);
      
      setGeneratedImages(prev => ({
        ...prev,
        [imageId]: imageUrl
      }));
      setGeneratingImage(null);
    }, 1000); // 1 second delay to simulate selection
  };


  return (
    <div className="content-area">
      <div className="content-header">
        <div className="content-header-left">
          {/* Navigation arrows */}
          {combinations.length > 1 && selectedCombination && (
            <div className="content-navigation-arrows">
              <button 
                className="content-nav-arrow"
                onClick={handlePreviousCombination}
                aria-label="Previous content"
                title="Previous content"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                className="content-nav-arrow"
                onClick={handleNextCombination}
                aria-label="Next content"
                title="Next content"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
          
          <div className="content-type-dropdown" ref={dropdownRef}>
          <button 
            className="content-type-badge"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
          >
            <div className="badge-content">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M4 6H12M4 8H10M4 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p>{getSelectedLabel()}</p>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="badge-chevron">
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
          {isDropdownOpen && combinations.length > 0 && (
            <div className="content-dropdown-menu">
              <div className={`content-dropdown-view ${drilldownAssetId ? 'drilled-down' : ''}`}>
                {/* Main view - Asset types */}
                <div className="content-dropdown-main">
                  {Object.entries(groupedCombinations).map(([assetId, combos]) => {
                    const assetName = combos[0].assetName;
                    
                    return (
                      <button
                        key={assetId}
                        className="content-dropdown-group-header"
                        onClick={() => handleAssetClick(assetId)}
                      >
                        <span className="content-dropdown-group-text">{assetName}</span>
                        <svg 
                          width="10" 
                          height="10" 
                          viewBox="0 0 10 10" 
                          fill="none"
                          className="content-chevron-icon"
                        >
                          <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    );
                  })}
                </div>

                {/* Drilldown view - Countries */}
                {drilldownAssetId && (
                  <div className="content-dropdown-drilldown">
                    <button
                      className="content-dropdown-back"
                      onClick={handleBackClick}
                    >
                      <svg 
                        width="10" 
                        height="10" 
                        viewBox="0 0 10 10" 
                        fill="none"
                        className="content-back-icon"
                      >
                        <path d="M6.5 2L3.5 5L6.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="content-dropdown-back-text">Back</span>
                    </button>
                    <div className="content-dropdown-separator"></div>
                    {groupedCombinations[drilldownAssetId]?.map((combo) => {
                      const key = `${combo.asset}-${combo.country}`;
                      const comboVariants = variants.filter(v => 
                        v.asset === combo.asset && v.country === combo.country
                      );
                      
                      return (
                        <div key={key}>
                          <button
                            className={`content-dropdown-item ${selectedCombination === key ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedCombination(key);
                              setIsDropdownOpen(false);
                              setDrilldownAssetId(null);
                            }}
                          >
                            <span className="content-dropdown-text">
                              {combo.countryName}
                            </span>
                          </button>
                          {comboVariants.length > 0 && comboVariants.map((variant) => (
                            <button
                              key={variant.id}
                              className={`content-dropdown-item variant-item ${selectedCombination === variant.id ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedCombination(variant.id);
                                setIsDropdownOpen(false);
                                setDrilldownAssetId(null);
                              }}
                            >
                              <span className="content-dropdown-text">
                                {combo.countryName} (Var {variant.variantNumber})
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
        
        {generatedContent && !isGenerating && (
          <div className="content-header-right">
            <div className="language-picker" ref={languageDropdownRef}>
              <div className="language-label">Language</div>
              <button 
                className="language-picker-button"
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                aria-expanded={isLanguageDropdownOpen}
              >
                <span className="language-picker-text">{selectedLanguage}</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="language-picker-chevron">
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {isLanguageDropdownOpen && (
                <div className="language-dropdown-menu">
                  {getAvailableLanguages().map((language) => (
                    <button
                      key={language}
                      className={`language-dropdown-item ${selectedLanguage === language ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedLanguage(language);
                        setIsLanguageDropdownOpen(false);
                      }}
                    >
                      <span className="language-dropdown-text">{language}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {generatedContent.language !== 'English (US)' && generatedContent.language !== 'English (UK)' && generatedContent.language !== 'English (CA)' && generatedContent.language !== 'English (AU)' && generatedContent.language !== 'English' && (
              <div className="translation-switch-container">
                <label className="translation-switch-label">
                  <span className="translation-switch-text">Live Translation</span>
                  <div className="translation-switch">
                    <input
                      type="checkbox"
                      checked={isTranslationEnabled}
                      onChange={(e) => setIsTranslationEnabled(e.target.checked)}
                      className="translation-switch-input"
                    />
                    <span className="translation-switch-slider"></span>
                  </div>
                </label>
              </div>
            )}
            <button 
              className={`add-to-library-button ${isLongPressing ? 'long-pressing' : ''}`}
              onMouseDown={handleLongPressStart}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={handleLongPressStart}
              onTouchEnd={handleLongPressEnd}
              title="Long press to add all variants to library"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="10" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M5 6H9M5 8.5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 5V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Add to Library</span>
              {isLongPressing && (
                <div className="long-press-indicator">
                  <div className="long-press-progress"></div>
                </div>
              )}
            </button>
            <button 
              className="create-variant-button"
              onClick={handleCreateVariant}
              title="Create variant"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Create variant</span>
            </button>
          </div>
        )}
      </div>
      <div className="content-body">
        {isGenerating ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p className="loading-text">Generating content...</p>
          </div>
        ) : generatedContent ? (
          <div className="blogpost-layout">
            <div className="blogpost-banner" style={getBannerStyle(generatedContent.country)}></div>
            <div className="blogpost-container" ref={contentScrollRef}>
              <div className="blogpost-content">
                {renderAuthorInfo(generatedContent)}
                {renderMarkdownContent(
                  generatedContent.content, 
                  generatedContent.prompt,
                  generatedImages,
                  generatingImage,
                  handleGenerateImage,
                  pinecoreImages.length > 0,
                  generatedContent.id,
                  highlightedExcerpt,
                  isTranslationEnabled,
                  hoveredSentence,
                  handleSentenceHover,
                  handleSentenceLeave,
                  isTranslating,
                  translatedText
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-content">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="empty-state-icon">
                <path d="M32 8L8 20V44L32 56L56 44V20L32 8Z" stroke="#E0E0E0" strokeWidth="2" fill="none"/>
                <path d="M32 24V40M24 32H40" stroke="#E0E0E0" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <h3>No content generated yet</h3>
              <p>Use the chat panel to generate content based on your selected country and content type.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to generate banner gradient based on country
function getBannerStyle(country: string): React.CSSProperties {
  // Define color themes based on country - inspired by flag colors and culture
  const countryGradients: { [key: string]: string } = {
    // Americas
    'US': 'linear-gradient(90deg, #b22234 0%, #3c3b6e 100%)', // Red, white, and blue
    'CA': 'linear-gradient(90deg, #ff0000 0%, #ffffff 50%, #ff0000 100%)', // Red and white
    'MX': 'linear-gradient(90deg, #006847 0%, #ffffff 50%, #ce1126 100%)', // Green, white, red
    'BR': 'linear-gradient(90deg, #009c3b 0%, #ffdf00 100%)', // Green and yellow
    
    // Europe
    'GB': 'linear-gradient(90deg, #012169 0%, #c8102e 100%)', // Blue and red
    'FR': 'linear-gradient(90deg, #002395 0%, #ffffff 50%, #ed2939 100%)', // Blue, white, red
    'DE': 'linear-gradient(90deg, #000000 0%, #dd0000 50%, #ffce00 100%)', // Black, red, gold
    'IT': 'linear-gradient(90deg, #009246 0%, #ffffff 50%, #ce2b37 100%)', // Green, white, red
    'ES': 'linear-gradient(90deg, #aa151b 0%, #f1bf00 100%)', // Red and yellow
    
    // Asia
    'JP': 'linear-gradient(90deg, #bc002d 0%, #ffffff 100%)', // Red and white
    'CN': 'linear-gradient(90deg, #de2910 0%, #ffde00 100%)', // Red and yellow
    'IN': 'linear-gradient(90deg, #ff9933 0%, #ffffff 50%, #138808 100%)', // Saffron, white, green
    
    // Oceania
    'AU': 'linear-gradient(90deg, #00008b 0%, #ffffff 50%, #ff0000 100%)', // Blue, white, red
  };
  
  // Return country-specific gradient or default
  return { 
    background: countryGradients[country] || 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' 
  };
}

// Helper function to generate author info based on country and content type
function renderAuthorInfo(content: GeneratedContent): React.ReactElement {
  const countryAuthors: { [key: string]: { name: string; title: string; initials: string; color: string } } = {
    'US': { name: 'Sarah Johnson', title: 'Content Strategist', initials: 'SJ', color: '#3b63fb' },
    'GB': { name: 'James Smith', title: 'Senior Writer', initials: 'JS', color: '#667eea' },
    'CA': { name: 'Emma Brown', title: 'Content Editor', initials: 'EB', color: '#f857a6' },
    'AU': { name: 'Oliver Davis', title: 'Content Creator', initials: 'OD', color: '#00d2ff' },
    'DE': { name: 'Anna Schmidt', title: 'Content Manager', initials: 'AS', color: '#fc466b' },
    'FR': { name: 'Marie Dubois', title: 'Rédactrice', initials: 'MD', color: '#667eea' },
    'ES': { name: 'Carlos García', title: 'Redactor de Contenido', initials: 'CG', color: '#f46b45' },
    'IT': { name: 'Giulia Rossi', title: 'Content Writer', initials: 'GR', color: '#f857a6' },
    'JP': { name: '田中美咲', title: 'コンテンツライター', initials: '田中', color: '#fc466b' },
    'CN': { name: '李明', title: '内容撰稿人', initials: '李明', color: '#FF5757' },
    'IN': { name: 'Priya Sharma', title: 'Content Writer', initials: 'PS', color: '#f46b45' },
    'BR': { name: 'Lucas Silva', title: 'Redator de Conteúdo', initials: 'LS', color: '#56ab2f' },
    'MX': { name: 'Sofia Rodriguez', title: 'Redactora', initials: 'SR', color: '#f46b45' },
  };
  
  const author = countryAuthors[content.country] || countryAuthors['US'];
  const date = content.timestamp.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return (
    <div className="author-info">
      <div className="author-avatar" style={{ backgroundColor: author.color }}>
        <span>{author.initials}</span>
      </div>
      <div className="author-details">
        <div className="author-name">{author.name}</div>
        <div className="author-meta">
          <span className="author-title">{author.title}</span>
          <span className="author-separator">•</span>
          <span className="author-date">{date}</span>
        </div>
      </div>
    </div>
  );
}

// Helper function to apply highlighting to text
function applyHighlighting(
  text: string, 
  highlightedExcerpt: { start: number; end: number } | null, 
  currentPosition: number,
  isTranslationEnabled?: boolean,
  hoveredSentence?: string | null,
  onHover?: (sentence: string) => void,
  onLeave?: () => void,
  isTranslating?: boolean,
  translatedText?: string
): React.ReactNode {
  // First apply translation wrapping if enabled
  if (isTranslationEnabled && !highlightedExcerpt && onHover && onLeave) {
    return wrapSentencesWithTranslation(text, isTranslationEnabled, hoveredSentence || null, onHover, onLeave, isTranslating || false, translatedText || '');
  }
  
  if (!highlightedExcerpt) {
    if (isTranslationEnabled && onHover && onLeave) {
      return wrapSentencesWithTranslation(text, isTranslationEnabled, hoveredSentence || null, onHover, onLeave, isTranslating || false, translatedText || '');
    }
    return text;
  }

  const textStart = currentPosition;
  const textEnd = currentPosition + text.length;
  const highlightStart = highlightedExcerpt.start;
  const highlightEnd = highlightedExcerpt.end;

  // Check if this text overlaps with the highlighted excerpt
  if (textEnd < highlightStart || textStart > highlightEnd) {
    return text; // No overlap
  }

  // Calculate the overlap
  const overlapStart = Math.max(0, highlightStart - textStart);
  const overlapEnd = Math.min(text.length, highlightEnd - textStart);

  if (overlapStart >= overlapEnd) {
    return text; // No valid overlap
  }

  // Split the text into parts: before, highlighted, after
  const before = text.substring(0, overlapStart);
  const highlighted = text.substring(overlapStart, overlapEnd);
  const after = text.substring(overlapEnd);

  return (
    <>
      {before}
      <span className="highlighted-excerpt">{highlighted}</span>
      {after}
    </>
  );
}

// Helper function to render markdown-style content with proper styling
// Mock translation function - in real implementation this would call an API
function translateToEnglish(text: string): string {
  // For demo purposes, simulate translation
  // In real implementation, this would call a translation API
  const translations: { [key: string]: string } = {
    // Add some common phrases for demo
    'Hola': 'Hello',
    'Gracias': 'Thank you',
    'Buenos días': 'Good morning',
  };
  
  // Simple word-by-word replacement for demo
  // In production, this would use a proper translation API
  return `${text} (English translation would appear here)`;
}

// Helper function to wrap sentences with translation capability
function wrapSentencesWithTranslation(
  text: string,
  isTranslationEnabled: boolean,
  hoveredSentence: string | null,
  onHover: (sentence: string) => void,
  onLeave: () => void,
  isTranslating: boolean,
  translatedText: string
): React.ReactNode {
  if (!isTranslationEnabled) {
    return text;
  }

  // Split text into sentences (simple split by . ! ?)
  const sentenceRegex = /([^.!?]+[.!?]+)/g;
  const sentences = text.match(sentenceRegex) || [text];
  
  return sentences.map((sentence, index) => {
    const isHovered = hoveredSentence === sentence.trim();
    
    // Determine what to show
    let displayText = sentence;
    if (isHovered) {
      if (isTranslating) {
        displayText = sentence; // Keep original text visible while loading
      } else if (translatedText) {
        displayText = translatedText;
      }
    }
    
    return (
      <span
        key={index}
        className={`translatable-sentence ${isHovered ? 'hovered' : ''} ${isHovered && isTranslating ? 'translating' : ''}`}
        data-sentence={sentence.trim()}
        onMouseEnter={() => onHover(sentence.trim())}
        onMouseLeave={onLeave}
      >
        {displayText}
        {isHovered && isTranslating && (
          <span className="translation-loader">
            <span className="loader-dot"></span>
            <span className="loader-dot"></span>
            <span className="loader-dot"></span>
          </span>
        )}
      </span>
    );
  });
}

function renderMarkdownContent(
  content: string, 
  prompt: string,
  generatedImages: { [key: string]: string },
  generatingImage: string | null,
  onGenerateImage: (keywords: string[], imageId: string) => void,
  pinecoreImagesAvailable: boolean,
  contentId: string,
  highlightedExcerpt?: { start: number; end: number } | null,
  isTranslationEnabled?: boolean,
  hoveredSentence?: string | null,
  onHover?: (sentence: string) => void,
  onLeave?: () => void,
  isTranslating?: boolean,
  translatedText?: string
) {
  const lines = content.split('\n');
  const elements: React.ReactElement[] = [];
  let key = 0;
  let paragraphCount = 0;
  let hasInsertedImage = false;
  let currentPosition = 0; // Track character position for highlighting

  // Extract keywords from content and generate image suggestions
  const imageSuggestions = generateImageSuggestions(prompt, content);
  const imageId = `default-${contentId}`;  // Use consistent ID for default image
  console.log('Image suggestions:', imageSuggestions);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Heading 1
    if (line.startsWith('# ')) {
      const headingText = line.substring(2);
      elements.push(
        <h1 key={key++} className="content-h1">
          {applyHighlighting(headingText, highlightedExcerpt, currentPosition + 2, isTranslationEnabled, hoveredSentence, onHover, onLeave, isTranslating, translatedText)}
        </h1>
      );
    }
    // Heading 2
    else if (line.startsWith('## ')) {
      const headingText = line.substring(3);
      elements.push(
        <h2 key={key++} className="content-h2">
          {applyHighlighting(headingText, highlightedExcerpt, currentPosition + 3, isTranslationEnabled, hoveredSentence, onHover, onLeave, isTranslating, translatedText)}
        </h2>
      );
      
      // Insert image after the first or second major section
      if (!hasInsertedImage && paragraphCount >= 2 && imageSuggestions.length > 0) {
        console.log('Inserting image suggestion, paragraphCount:', paragraphCount);
        const isGenerating = generatingImage === imageId;
        const generatedImageUrl = generatedImages[imageId];
        console.log('Is generating:', isGenerating, 'Generated URL:', generatedImageUrl);
        
        if (generatedImageUrl) {
          // Show the generated image with option to use different image
          console.log('Rendering generated image, pinecoreImagesAvailable:', pinecoreImagesAvailable);
          
          // Extract filename from URL and format it as title
          const getImageTitleFromUrl = (url: string): string => {
            const filename = url.split('/').pop() || '';
            const nameWithoutExt = filename.replace(/\.[^/.]+$/, ''); // Remove extension
            // Replace underscores and hyphens with spaces, and capitalize words
            return nameWithoutExt
              .replace(/[_-]/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
          };
          
          const imageTitle = getImageTitleFromUrl(generatedImageUrl);
          
          elements.push(
            <div key={key++} className="inline-image-generated">
              <div className="generated-image-container">
                <img src={generatedImageUrl} alt={imageTitle} className="generated-image" />
                <button 
                  className="use-different-image-button"
                  onClick={() => onGenerateImage(imageSuggestions[0].keywords, imageId)}
                  title="Use different image from Pinecore collection"
                  style={{ display: pinecoreImagesAvailable ? 'flex' : 'none' }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13 3L3 13M3 3L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M8 1V4M8 12V15M1 8H4M12 8H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Use Different Image
                </button>
              </div>
              <div className="image-caption">{imageTitle}</div>
            </div>
          );
        } else {
          // Show the placeholder with keywords
          elements.push(
            <div key={key++} className="inline-image-suggestion">
              <div className="image-placeholder">
                {isGenerating ? (
                  <div className="image-generating">
                    <div className="image-spinner"></div>
                    <span className="image-generating-label">Generating...</span>
                  </div>
                ) : (
                  <>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                      <rect x="4" y="4" width="40" height="40" rx="4" stroke="#d1d1d1" strokeWidth="2" fill="#f8f8f8"/>
                      <circle cx="16" cy="18" r="4" fill="#d1d1d1"/>
                      <path d="M4 32L14 22L24 32L34 22L44 32V40C44 42.2091 42.2091 44 40 44H8C5.79086 44 4 42.2091 4 40V32Z" fill="#d1d1d1"/>
                    </svg>
                    <span className="image-icon-label">Suggested Image</span>
                  </>
                )}
              </div>
              <div className="image-suggestion-details">
                <div className="image-suggestion-title">{imageSuggestions[0].title}</div>
                <div className="image-suggestion-description">{imageSuggestions[0].description}</div>
                <div className="image-suggestion-keywords">
                  <span className="keywords-label">Keywords:</span>
                  {imageSuggestions[0].keywords.map((keyword, idx) => (
                    <span key={idx} className="keyword-tag">{keyword}</span>
                  ))}
                </div>
                {!isGenerating && (
                  <>
                    <button 
                      className="generate-image-button"
                      onClick={() => onGenerateImage(imageSuggestions[0].keywords, imageId)}
                      disabled={!pinecoreImagesAvailable}
                      title={pinecoreImagesAvailable ? 'Generate image from Pinecore collection' : 'No Pinecore images available'}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      Generate Image
                    </button>
                    {!pinecoreImagesAvailable && (
                      <p className="image-unavailable-message">
                        Add images to <code>public/pinecore-images/</code> folder to enable image generation
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        }
        hasInsertedImage = true;
      }
    }
    // Heading 3
    else if (line.startsWith('### ')) {
      const headingText = line.substring(4);
      elements.push(
        <h3 key={key++} className="content-h3">
          {applyHighlighting(headingText, highlightedExcerpt, currentPosition + 4, isTranslationEnabled, hoveredSentence, onHover, onLeave, isTranslating, translatedText)}
        </h3>
      );
    }
    // Horizontal rule
    else if (line.trim() === '---') {
      elements.push(<hr key={key++} className="content-hr" />);
    }
    // Bullet point
    else if (line.startsWith('- ')) {
      const bulletText = line.substring(2);
      elements.push(
        <li key={key++} className="content-li">
          {applyHighlighting(bulletText, highlightedExcerpt, currentPosition + 2, isTranslationEnabled, hoveredSentence, onHover, onLeave, isTranslating, translatedText)}
        </li>
      );
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+\.\s)(.*)$/);
      if (match) {
        const listText = match[2];
        const prefixLength = match[1].length;
        elements.push(
          <li key={key++} className="content-li numbered">
            {applyHighlighting(listText, highlightedExcerpt, currentPosition + prefixLength, isTranslationEnabled, hoveredSentence, onHover, onLeave, isTranslating, translatedText)}
          </li>
        );
      }
    }
    // Empty line
    else if (line.trim() === '') {
      elements.push(<div key={key++} className="content-spacer" />);
    }
    // Regular paragraph
    else {
      elements.push(
        <p key={key++} className="content-p">
          {applyHighlighting(line, highlightedExcerpt, currentPosition, isTranslationEnabled, hoveredSentence, onHover, onLeave, isTranslating, translatedText)}
        </p>
      );
      paragraphCount++;
    }
    
    // Update position for next line (including newline character)
    currentPosition += line.length + 1;
  }

  return elements;
}

// Helper function to extract important keywords from content
function extractKeywordsFromContent(content: string, prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase();
  
  // Common words to exclude
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it',
    'its', 'they', 'them', 'their', 'we', 'our', 'you', 'your', 'market',
    'content', 'generated', 'provides', 'includes', 'consumers', 'audiences'
  ]);
  
  // Extract words from headings (they're usually important)
  const headingRegex = /^#+\s+(.+)$/gm;
  const headings: string[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push(...match[1].toLowerCase().split(/\s+/));
  }
  
  // Extract capitalized words (often important terms)
  const capitalizedWords = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  
  // Extract words from the prompt (usually central to the topic)
  const promptWords = lowerPrompt.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
  
  // Combine and count frequency
  const wordFreq: { [key: string]: number } = {};
  const allWords = [...headings, ...capitalizedWords.map(w => w.toLowerCase()), ...promptWords];
  
  allWords.forEach(word => {
    const cleaned = word.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (cleaned.length > 3 && !stopWords.has(cleaned)) {
      wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1;
    }
  });
  
  // Sort by frequency and return top keywords
  const sortedKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 5);
  
  return sortedKeywords.length > 0 ? sortedKeywords : ['professional', 'content', 'visual', 'modern', 'quality'];
}

// Helper function to generate contextual image suggestions
function generateImageSuggestions(prompt: string, content: string): Array<{ title: string; description: string; keywords: string[] }> {
  const lowerPrompt = prompt.toLowerCase();
  
  // Extract keywords from actual content
  const extractedKeywords = extractKeywordsFromContent(content, prompt);
  
  // Technology topics
  if (lowerPrompt.includes('ai') || lowerPrompt.includes('artificial intelligence')) {
    return [{
      title: 'AI Neural Network Visualization',
      description: 'A modern, abstract visualization showing interconnected neural nodes with glowing blue and purple connections, representing AI technology and machine learning processes.',
      keywords: extractedKeywords
    }];
  }
  
  if (lowerPrompt.includes('tech') || lowerPrompt.includes('software') || lowerPrompt.includes('digital')) {
    return [{
      title: 'Modern Technology Workspace',
      description: 'A clean, minimalist workspace featuring multiple monitors displaying code and dashboards, with modern lighting and tech equipment.',
      keywords: extractedKeywords
    }];
  }
  
  // Health & Wellness
  if (lowerPrompt.includes('health') || lowerPrompt.includes('wellness') || lowerPrompt.includes('fitness')) {
    return [{
      title: 'Healthy Lifestyle Scene',
      description: 'A bright, inviting image showing fresh vegetables, fruits, and fitness equipment arranged artistically on a clean surface with natural lighting.',
      keywords: extractedKeywords
    }];
  }
  
  // Business & Finance
  if (lowerPrompt.includes('business') || lowerPrompt.includes('finance') || lowerPrompt.includes('marketing')) {
    return [{
      title: 'Business Strategy Meeting',
      description: 'Professional team collaborating around a modern conference table with charts, graphs, and digital displays showing business analytics and growth metrics.',
      keywords: extractedKeywords
    }];
  }
  
  // Food & Beverage
  if (lowerPrompt.includes('food') || lowerPrompt.includes('drink') || lowerPrompt.includes('recipe') || lowerPrompt.includes('cooking')) {
    return [{
      title: 'Gourmet Food Presentation',
      description: 'Beautifully plated dish or artisanal beverage photographed from above with natural lighting, garnishes, and complementary ingredients arranged aesthetically.',
      keywords: extractedKeywords
    }];
  }
  
  // Travel & Adventure
  if (lowerPrompt.includes('travel') || lowerPrompt.includes('adventure') || lowerPrompt.includes('tourism') || lowerPrompt.includes('vacation')) {
    return [{
      title: 'Stunning Travel Destination',
      description: 'Breathtaking landscape or cityscape capturing the essence of travel and adventure, featuring iconic landmarks, natural beauty, or cultural scenes.',
      keywords: extractedKeywords
    }];
  }
  
  // Education
  if (lowerPrompt.includes('education') || lowerPrompt.includes('learning') || lowerPrompt.includes('training') || lowerPrompt.includes('course')) {
    return [{
      title: 'Modern Learning Environment',
      description: 'Engaging educational setting with students or professionals in a contemporary classroom or online learning setup, featuring technology and collaborative spaces.',
      keywords: extractedKeywords
    }];
  }
  
  // Environment & Nature
  if (lowerPrompt.includes('environment') || lowerPrompt.includes('nature') || lowerPrompt.includes('sustainability') || lowerPrompt.includes('eco')) {
    return [{
      title: 'Natural Environment Scene',
      description: 'Pristine natural landscape showcasing environmental beauty, featuring lush greenery, clean water, or sustainable practices in harmony with nature.',
      keywords: extractedKeywords
    }];
  }
  
  // Creative & Design
  if (lowerPrompt.includes('design') || lowerPrompt.includes('creative') || lowerPrompt.includes('art')) {
    return [{
      title: 'Creative Design Process',
      description: 'Inspiring creative workspace with design tools, sketches, color palettes, and artistic materials arranged to showcase the creative process.',
      keywords: extractedKeywords
    }];
  }
  
  // Remote work
  if (lowerPrompt.includes('remote') || lowerPrompt.includes('work from home') || lowerPrompt.includes('wfh')) {
    return [{
      title: 'Remote Work Setup',
      description: 'Comfortable and productive home office setup with laptop, plants, natural light, and organized workspace demonstrating work-life balance.',
      keywords: extractedKeywords
    }];
  }
  
  // Default generic suggestion
  return [{
    title: `Visual Representation of ${prompt}`,
    description: `A professional, high-quality image that visually represents the key concepts and themes discussed in "${prompt}", helping readers better understand and engage with the content.`,
    keywords: extractedKeywords
  }];
}

// Helper to parse inline formatting like **bold** and *italic*
function parseInlineFormatting(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let key = 0;

  // Bold: **text**
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(<strong key={`bold-${key++}`}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
