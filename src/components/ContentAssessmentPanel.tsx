import { useState, useRef, useEffect } from 'react';
import './ContentAssessmentPanel.css';

interface ContentAssessmentPanelProps {
  generatedContent?: {
    id: string;
    prompt: string;
    country: string;
    contentType: string;
    language: string;
    content: string;
    timestamp: Date;
  } | null;
  onHighlightExcerpt?: (excerptStart: number, excerptEnd: number) => void;
}

interface AssessmentMetric {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  description: string;
  suggestions?: SuggestionItem[];
}

interface SuggestionItem {
  text: string;
  excerpt: string;
  excerptStart: number;
  excerptEnd: number;
}

export default function ContentAssessmentPanel({ generatedContent, onHighlightExcerpt }: ContentAssessmentPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'suggestions'>('overview');
  const [panelWidth, setPanelWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      if (panelRef.current) {
        const containerRect = panelRef.current.parentElement?.getBoundingClientRect();
        if (containerRect) {
          const newWidth = containerRect.right - e.clientX;
          // Constrain width between 280px and 600px
          const constrainedWidth = Math.min(Math.max(newWidth, 280), 600);
          setPanelWidth(constrainedWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Function to find excerpts in content for suggestions
  const findExcerptInContent = (searchText: string, content: string): { start: number; end: number } => {
    const lowerContent = content.toLowerCase();
    const lowerSearch = searchText.toLowerCase();
    const index = lowerContent.indexOf(lowerSearch);
    
    if (index !== -1) {
      return { start: index, end: index + searchText.length };
    }
    
    // If exact match not found, try to find similar patterns
    const words = searchText.split(' ');
    for (const word of words) {
      if (word.length > 3) {
        const wordIndex = lowerContent.indexOf(word.toLowerCase());
        if (wordIndex !== -1) {
          return { start: wordIndex, end: wordIndex + word.length };
        }
      }
    }
    
    return { start: 0, end: 0 };
  };

  // Generate assessment metrics with content-linked suggestions
  const generateAssessmentMetrics = (): AssessmentMetric[] => {
    if (!generatedContent?.content) {
      return [];
    }

    const content = generatedContent.content;
    const contentLength = content.length;
    
    // Calculate dynamic scores based on content characteristics
    const calculateReadabilityScore = (): number => {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const words = content.split(/\s+/).filter(w => w.trim().length > 0);
      const avgSentenceLength = words.length / Math.max(sentences.length, 1);
      
      // Ideal sentence length is 15-20 words
      let score = 100;
      if (avgSentenceLength > 25) score -= 15;
      else if (avgSentenceLength > 20) score -= 8;
      if (avgSentenceLength < 10) score -= 10;
      
      // Check for long sentences
      const longSentences = sentences.filter(s => s.length > 150).length;
      score -= longSentences * 5;
      
      return Math.max(60, Math.min(100, score));
    };
    
    const calculateEngagementScore = (): number => {
      let score = 70;
      
      // Check for questions (engaging)
      const questionMarks = (content.match(/\?/g) || []).length;
      score += Math.min(questionMarks * 3, 15);
      
      // Check for exclamation marks (energy)
      const exclamationMarks = (content.match(/!/g) || []).length;
      score += Math.min(exclamationMarks * 2, 10);
      
      // Check for bullet points (structure)
      const bulletPoints = (content.match(/^[-•]/gm) || []).length;
      score += Math.min(bulletPoints * 2, 10);
      
      // Check for headings
      const headings = (content.match(/^#{1,3}\s/gm) || []).length;
      score += Math.min(headings * 3, 15);
      
      return Math.max(60, Math.min(100, score));
    };
    
    const calculateToneScore = (): number => {
      let score = 75;
      
      // Country-specific tone adjustments
      const country = generatedContent.country;
      
      // Check for formal language
      const formalWords = ['furthermore', 'moreover', 'subsequently', 'henceforth'].filter(word => 
        content.toLowerCase().includes(word)
      ).length;
      
      // US prefers conversational
      if (country === 'US' && formalWords > 3) score -= 10;
      if (country === 'US' && formalWords === 0) score += 10;
      
      // Japan/Germany prefer formal
      if ((country === 'JP' || country === 'DE') && formalWords > 0) score += 10;
      
      // Check for emojis (casual vs formal)
      const emojis = (content.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
      if (country === 'US' && emojis > 0) score += 5;
      if ((country === 'JP' || country === 'DE') && emojis > 2) score -= 10;
      
      return Math.max(65, Math.min(100, score));
    };
    
    const calculateCulturalFitScore = (): number => {
      let score = 80;
      const country = generatedContent.country;
      const countryName = content.toLowerCase().includes(country.toLowerCase()) || 
                          content.toLowerCase().includes(generatedContent.country);
      
      // Bonus for mentioning country/market
      if (countryName) score += 12;
      
      // Check for cultural references
      const culturalMarkers = [country, 'market', 'local', 'regional', 'cultural', 'tradition'];
      const culturalMentions = culturalMarkers.filter(marker => 
        content.toLowerCase().includes(marker.toLowerCase())
      ).length;
      
      score += Math.min(culturalMentions * 2, 15);
      
      return Math.max(70, Math.min(100, score));
    };
    
    const calculateSEOScore = (): number => {
      let score = 65;
      
      // Check for headings
      const h1Count = (content.match(/^#\s/gm) || []).length;
      const h2Count = (content.match(/^##\s/gm) || []).length;
      
      if (h1Count === 1) score += 10; // Good: exactly one H1
      if (h2Count >= 2) score += 10; // Good: multiple H2s
      
      // Check content length (ideal for SEO)
      if (contentLength > 600 && contentLength < 2000) score += 15;
      
      // Check for lists
      const lists = (content.match(/^[-•\d]/gm) || []).length;
      if (lists > 3) score += 10;
      
      return Math.max(60, Math.min(100, score));
    };
    
    const calculateBrandAlignmentScore = (): number => {
      let score = 82;
      
      // Consistency check: similar content length and structure
      const hasGoodStructure = (content.match(/^#{1,3}\s/gm) || []).length >= 3;
      if (hasGoodStructure) score += 8;
      
      // Check for professional tone
      const professionalWords = ['professional', 'quality', 'expert', 'solution', 'innovative'];
      const professionalMentions = professionalWords.filter(word => 
        content.toLowerCase().includes(word.toLowerCase())
      ).length;
      
      score += Math.min(professionalMentions * 2, 10);
      
      return Math.max(70, Math.min(100, score));
    };

    // Find specific excerpts for suggestions
    const findReadabilityIssues = () => {
      // Look for long sentences or complex phrases
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const longSentences = sentences.filter(s => s.length > 150);
      const suggestions: SuggestionItem[] = [];

      if (longSentences.length > 0) {
        const excerpt = longSentences[0].trim().substring(0, 100) + '...';
        const position = findExcerptInContent(longSentences[0].substring(0, 50), content);
        suggestions.push({
          text: 'Consider breaking this long sentence for better readability',
          excerpt,
          excerptStart: position.start,
          excerptEnd: position.end
        });
      }

      // Look for areas that could use transition words
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
      if (paragraphs.length > 1) {
        const secondParagraph = paragraphs[1].substring(0, 100);
        const position = findExcerptInContent(secondParagraph.substring(0, 30), content);
        suggestions.push({
          text: 'Add transition words to improve flow between paragraphs',
          excerpt: secondParagraph + '...',
          excerptStart: position.start,
          excerptEnd: position.end
        });
      }

      return suggestions;
    };

    const findEngagementOpportunities = () => {
      const suggestions: SuggestionItem[] = [];
      
      // Look for areas that could use more engagement
      const firstParagraph = content.split('\n\n')[0] || content.substring(0, 200);
      const position = findExcerptInContent(firstParagraph.substring(0, 50), content);
      
      suggestions.push({
        text: 'Add a compelling hook or question to increase engagement',
        excerpt: firstParagraph.substring(0, 100) + '...',
        excerptStart: position.start,
        excerptEnd: Math.min(position.start + 100, contentLength)
      });

      // Look for conclusion area
      const lastParagraph = content.split('\n\n').slice(-1)[0] || content.substring(content.length - 200);
      const conclusionPosition = findExcerptInContent(lastParagraph.substring(0, 30), content);
      
      suggestions.push({
        text: 'Include a strong call-to-action in the conclusion',
        excerpt: lastParagraph.substring(0, 100) + '...',
        excerptStart: conclusionPosition.start,
        excerptEnd: Math.min(conclusionPosition.end + 50, contentLength)
      });

      return suggestions;
    };

    const findToneOpportunities = () => {
      const suggestions: SuggestionItem[] = [];
      
      // Look for formal language that could be more conversational
      const formalPhrases = ['furthermore', 'moreover', 'in conclusion', 'it is important to note'];
      for (const phrase of formalPhrases) {
        const position = findExcerptInContent(phrase, content);
        if (position.start > 0) {
          const contextStart = Math.max(0, position.start - 50);
          const contextEnd = Math.min(contentLength, position.end + 50);
          suggestions.push({
            text: 'Consider using more conversational language here',
            excerpt: content.substring(contextStart, contextEnd),
            excerptStart: position.start,
            excerptEnd: position.end
          });
          break;
        }
      }

      // Look for areas that could use more personality
      const midContent = content.substring(Math.floor(contentLength * 0.3), Math.floor(contentLength * 0.7));
      const midPosition = Math.floor(contentLength * 0.3);
      
      suggestions.push({
        text: 'Add more personality and brand voice to this section',
        excerpt: midContent.substring(0, 100) + '...',
        excerptStart: midPosition,
        excerptEnd: midPosition + 100
      });

      return suggestions;
    };

    return [
      {
        id: 'readability',
        name: 'Readability',
        score: calculateReadabilityScore(),
        maxScore: 100,
        description: 'How easy the content is to read and understand',
        suggestions: findReadabilityIssues()
      },
      {
        id: 'engagement',
        name: 'Engagement',
        score: calculateEngagementScore(),
        maxScore: 100,
        description: 'Potential to capture and hold audience attention',
        suggestions: findEngagementOpportunities()
      },
      {
        id: 'tone-of-voice',
        name: 'Tone of Voice',
        score: calculateToneScore(),
        maxScore: 100,
        description: 'Consistency and appropriateness of communication style',
        suggestions: findToneOpportunities()
      },
      {
        id: 'cultural-fit',
        name: 'Cultural Fit',
        score: calculateCulturalFitScore(),
        maxScore: 100,
        description: 'Alignment with target market cultural preferences',
        suggestions: [
          {
            text: 'Excellent cultural adaptation for the target market',
            excerpt: content.substring(0, 100) + '...',
            excerptStart: 0,
            excerptEnd: 100
          }
        ]
      },
      {
        id: 'seo-score',
        name: 'SEO Score',
        score: calculateSEOScore(),
        maxScore: 100,
        description: 'Search engine optimization potential',
        suggestions: [
          {
            text: 'Add more relevant keywords in the title and headers',
            excerpt: content.substring(0, 100) + '...',
            excerptStart: 0,
            excerptEnd: 100
          }
        ]
      },
      {
        id: 'brand-alignment',
        name: 'Brand Alignment',
        score: calculateBrandAlignmentScore(),
        maxScore: 100,
        description: 'Consistency with brand voice and messaging',
        suggestions: [
          {
            text: 'Strong brand voice consistency throughout',
            excerpt: content.substring(0, 100) + '...',
            excerptStart: 0,
            excerptEnd: 100
          }
        ]
      }
    ];
  };

  const assessmentMetrics = generateAssessmentMetrics();

  const overallScore = Math.round(
    assessmentMetrics.reduce((sum, metric) => sum + metric.score, 0) / assessmentMetrics.length
  );

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#22c55e'; // Green
    if (score >= 70) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  const handleSuggestionClick = (suggestion: SuggestionItem) => {
    if (onHighlightExcerpt) {
      onHighlightExcerpt(suggestion.excerptStart, suggestion.excerptEnd);
    }
  };

  // Detect instances of cultural faux pas in content
  const detectFauxPasInstances = (warning: string, content: string): number => {
    const lowerContent = content.toLowerCase();
    let count = 0;

    // Detection patterns for common issues
    const patterns: { [key: string]: RegExp[] } = {
      'formal': [/\b(henceforth|heretofore|aforementioned|pursuant|whereby|thereof)\b/gi],
      'political': [/\b(democrat|republican|liberal|conservative|election|vote|campaign|president|congress)\b/gi],
      'metric': [/\b(\d+\s*(kilometer|metre|kilogram|celsius|litre)s?)\b/gi],
      'income': [/\b(rich|poor|wealthy|affluent|luxury|premium|budget|cheap)\b/gi],
      'superlative': [/\b(best|greatest|most amazing|incredible|unbelievable|revolutionary|game-changing)\b/gi],
      'casual': [/\b(hey|yo|sup|gonna|wanna|yeah|nah)\b/gi],
      'stereotype': [/\b(tea|weather|royal|carnival|soccer|beach|immigrant|poverty)\b/gi],
    };

    // Match patterns based on warning content
    const warningLower = warning.toLowerCase();
    
    if (warningLower.includes('formal')) {
      patterns.formal.forEach(regex => {
        const matches = lowerContent.match(regex);
        if (matches) count += matches.length;
      });
    }
    
    if (warningLower.includes('political')) {
      patterns.political.forEach(regex => {
        const matches = lowerContent.match(regex);
        if (matches) count += matches.length;
      });
    }
    
    if (warningLower.includes('metric') || warningLower.includes('measurement')) {
      patterns.metric.forEach(regex => {
        const matches = lowerContent.match(regex);
        if (matches) count += matches.length;
      });
    }
    
    if (warningLower.includes('income') || warningLower.includes('lifestyle')) {
      patterns.income.forEach(regex => {
        const matches = lowerContent.match(regex);
        if (matches) count += matches.length;
      });
    }
    
    if (warningLower.includes('superlative') || warningLower.includes('hyperbole')) {
      patterns.superlative.forEach(regex => {
        const matches = lowerContent.match(regex);
        if (matches) count += matches.length;
      });
    }
    
    if (warningLower.includes('casual')) {
      patterns.casual.forEach(regex => {
        const matches = lowerContent.match(regex);
        if (matches) count += matches.length;
      });
    }
    
    if (warningLower.includes('stereotype')) {
      patterns.stereotype.forEach(regex => {
        const matches = lowerContent.match(regex);
        if (matches) count += matches.length;
      });
    }

    return count;
  };

  const getCulturalFauxPasGuidance = (country: string): React.ReactNode => {
    const content = generatedContent?.content || '';
    
    const guidance: { [key: string]: { flag: string; title: string; content: string; warnings: string[] } } = {
      'US': {
        flag: '🇺🇸',
        title: 'United States',
        content: 'Americans value directness and individualism. Keep tone conversational and inclusive.',
        warnings: [
          'Avoid overly formal language',
          'Don\'t assume lifestyle or income levels',
          'Steer clear of political references',
          'Include imperial measurements'
        ]
      },
      'GB': {
        title: 'United Kingdom Cultural Considerations',
        content: 'British audiences appreciate wit, understatement, and quality. Respect traditions while acknowledging modern diversity.',
        warnings: [
          'Avoid overly enthusiastic or "salesy" language - British prefer understated confidence',
          'Don\'t assume knowledge of American cultural references',
          'Be careful with humor - what\'s funny in one region may not translate',
          'Avoid stereotypes about tea, weather, or royal family obsession',
          'Don\'t conflate England with the entire UK (Scotland, Wales, Northern Ireland)'
        ]
      },
      'DE': {
        title: 'Germany Cultural Considerations',
        content: 'German audiences value precision, quality, and efficiency. Direct communication is appreciated, but maintain professionalism.',
        warnings: [
          'Avoid superficial or overly emotional appeals - Germans prefer factual, logical arguments',
          'Don\'t use excessive superlatives or marketing hyperbole',
          'Be precise with technical details and avoid vague claims',
          'Avoid references to WWII or Nazi history unless absolutely relevant and respectful',
          'Don\'t assume all Germans are the same - significant regional differences exist'
        ]
      },
      'FR': {
        title: 'France Cultural Considerations',
        content: 'French audiences appreciate elegance, sophistication, and cultural refinement. Quality and artistry are highly valued.',
        warnings: [
          'Avoid comparing France unfavorably to other countries, especially the US',
          'Don\'t use overly casual language - French prefer more formal, elegant expression',
          'Be careful with food and wine references - avoid clichés or oversimplifications',
          'Don\'t assume English proficiency - consider providing French translations for key terms',
          'Avoid stereotypes about romance, fashion, or arrogance'
        ]
      },
      'JP': {
        title: 'Japan Cultural Considerations',
        content: 'Japanese audiences value harmony, respect, and attention to detail. Subtle communication and group consensus are important.',
        warnings: [
          'Avoid overly direct criticism or confrontational language',
          'Don\'t rush to the point - Japanese appreciate context and relationship building',
          'Be respectful of hierarchy and avoid casual references to authority figures',
          'Don\'t use overly individualistic messaging - emphasize community and harmony',
          'Avoid assumptions about technology adoption or Western cultural knowledge'
        ]
      },
      'CN': {
        title: 'China Cultural Considerations',
        content: 'Chinese audiences value respect, prosperity, and family. Be mindful of cultural traditions and modern aspirations.',
        warnings: [
          'Avoid political references or sensitive historical topics',
          'Don\'t use imagery or numbers considered unlucky (4, white flowers for funerals)',
          'Be respectful of traditional values while acknowledging modern lifestyle',
          'Don\'t assume familiarity with Western cultural references or humor',
          'Avoid generalizations about rural vs urban populations'
        ]
      },
      'IN': {
        title: 'India Cultural Considerations',
        content: 'Indian audiences are diverse, multilingual, and value family, respect, and achievement. Consider regional and cultural diversity.',
        warnings: [
          'Don\'t treat India as homogeneous - vast linguistic, cultural, and economic diversity exists',
          'Avoid assumptions about religion, caste, or traditional practices',
          'Be mindful of vegetarian preferences and dietary restrictions',
          'Don\'t use overly Western-centric examples or cultural references',
          'Avoid stereotypes about technology, poverty, or spirituality'
        ]
      },
      'BR': {
        title: 'Brazil Cultural Considerations',
        content: 'Brazilian audiences value warmth, community, and celebration. Family and social connections are central to culture.',
        warnings: [
          'Don\'t assume Spanish language or culture - Brazil is Portuguese-speaking with unique culture',
          'Avoid overly formal or cold communication - Brazilians prefer warm, personal tone',
          'Be mindful of economic diversity and avoid assumptions about purchasing power',
          'Don\'t stereotype about carnival, soccer, or beaches as universal experiences',
          'Avoid generalizations about crime or safety that may perpetuate negative stereotypes'
        ]
      },
      'MX': {
        title: 'Mexico Cultural Considerations',
        content: 'Mexican audiences value family, tradition, and personal relationships. Respect for elders and community is important.',
        warnings: [
          'Avoid stereotypes about food, music, or traditional dress',
          'Don\'t assume all Mexicans are immigrants or have immigration concerns',
          'Be respectful of indigenous cultures and avoid appropriation',
          'Don\'t use Tex-Mex as representative of authentic Mexican culture',
          'Avoid assumptions about economic status or education levels'
        ]
      },
      'CA': {
        title: 'Canada Cultural Considerations',
        content: 'Canadian audiences value politeness, multiculturalism, and inclusivity. Respect for diversity and community is paramount.',
        warnings: [
          'Don\'t assume Canada is just "America\'s hat" - distinct cultural identity exists',
          'Avoid ignoring French-Canadian culture and bilingual nature',
          'Be inclusive of Indigenous peoples and their contributions',
          'Don\'t stereotype about politeness, hockey, or cold weather',
          'Avoid assumptions about healthcare or political systems'
        ]
      },
      'AU': {
        title: 'Australia Cultural Considerations',
        content: 'Australian audiences value authenticity, humor, and egalitarianism. Direct communication and "fair dinkum" attitudes are appreciated.',
        warnings: [
          'Avoid overly formal or pretentious language - Australians prefer down-to-earth communication',
          'Don\'t stereotype about dangerous animals, Outback life, or "shrimp on the barbie"',
          'Be respectful of Aboriginal and Torres Strait Islander cultures',
          'Don\'t assume all Australians live in rural areas - most live in major cities',
          'Avoid British or American cultural assumptions - Australia has its own identity'
        ]
      },
      'ES': {
        title: 'Spain Cultural Considerations',
        content: 'Spanish audiences value family, tradition, and regional identity. Respect for local customs and regional differences is important.',
        warnings: [
          'Don\'t confuse Spanish culture with Latin American cultures',
          'Avoid assumptions about siesta, bullfighting, or flamenco as universal experiences',
          'Be mindful of strong regional identities (Catalonia, Basque Country, etc.)',
          'Don\'t ignore the diversity of languages spoken (Catalan, Basque, Galician)',
          'Avoid stereotypes about laziness or economic issues'
        ]
      },
      'IT': {
        title: 'Italy Cultural Considerations',
        content: 'Italian audiences value family, quality, and tradition. Appreciation for art, food, and craftsmanship runs deep.',
        warnings: [
          'Don\'t stereotype about pasta, pizza, or mafia - Italy has rich, diverse culture',
          'Avoid assumptions about punctuality or business practices',
          'Be respectful of strong regional differences (North vs South)',
          'Don\'t trivialize food culture - cuisine is taken very seriously',
          'Avoid clichés about romance, fashion, or gesturing'
        ]
      }
    };

    const countryGuidance = guidance[country] || guidance['US'];

    return (
      <div className="faux-pas-guidance">
        <h5 className="guidance-title">{countryGuidance.title}</h5>
        <p className="guidance-description">{countryGuidance.content}</p>
        <div className="warnings-section">
          <h6 className="warnings-title">Key Things to Avoid:</h6>
          <ul className="warnings-list">
            {countryGuidance.warnings.map((warning, index) => {
              const instanceCount = detectFauxPasInstances(warning, content);
              return (
                <li key={index} className="warning-item">
                  <div className="warning-text">{warning}</div>
                  <div className={`warning-detection ${instanceCount > 0 ? 'has-instances' : 'no-instances'}`}>
                    {instanceCount > 0 ? (
                      <span className="detection-count">⚠️ {instanceCount} instance{instanceCount !== 1 ? 's' : ''} detected</span>
                    ) : (
                      <span className="detection-count">✓ No instances detected</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  };

  if (!generatedContent) {
    return (
      <div className="content-assessment-panel">
        <div className="assessment-header">
          <h2>Content Assessment</h2>
        </div>
        <div className="assessment-empty">
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M24 4L30.18 16.82L44 18L34 27.18L36.36 41L24 34.82L11.64 41L14 27.18L4 18L17.82 16.82L24 4Z" stroke="#6E6E6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>No Content to Assess</h3>
            <p>Generate content using the chat panel to see detailed assessment metrics and suggestions.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={panelRef}
      className="content-assessment-panel" 
      style={{ width: `${panelWidth}px` }}
    >
      <div 
        className="resize-handle"
        onMouseDown={handleMouseDown}
        title="Drag to resize"
      />
      <div className="assessment-header">
        <h2>Content Assessment</h2>
        <div className="overall-score">
          <div className="score-circle" style={{ borderColor: getScoreColor(overallScore) }}>
            <span className="score-number" style={{ color: getScoreColor(overallScore) }}>
              {overallScore}
            </span>
          </div>
          <div className="score-info">
            <div className="score-label" style={{ color: getScoreColor(overallScore) }}>
              {getScoreLabel(overallScore)}
            </div>
            <div className="score-subtitle">Overall Score</div>
          </div>
        </div>
      </div>

      <div className="assessment-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          Metrics
        </button>
        <button 
          className={`tab-button ${activeTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          Suggestions
        </button>
      </div>

      <div className="assessment-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="content-info">
              <div className="info-item">
                <label>Content Type</label>
                <span>{generatedContent.contentType}</span>
              </div>
              <div className="info-item">
                <label>Target Market</label>
                <span>{generatedContent.country}</span>
              </div>
              <div className="info-item">
                <label>Language</label>
                <span>{generatedContent.language}</span>
              </div>
            </div>

            <div className="cultural-faux-pas">
              <h4>Cultural Faux Pas</h4>
              <div className="faux-pas-content">
                {getCulturalFauxPasGuidance(generatedContent?.country || 'US')}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="metrics-tab">
            <div className="metrics-list">
              {assessmentMetrics.map((metric) => (
                <div key={metric.id} className="metric-item">
                  <div className="metric-header">
                    <div className="metric-title">
                      <span className="metric-name">{metric.name}</span>
                      <span className="metric-score" style={{ color: getScoreColor(metric.score) }}>
                        {metric.score}/{metric.maxScore}
                      </span>
                    </div>
                    <div className="metric-bar">
                      <div 
                        className="metric-progress" 
                        style={{ 
                          width: `${(metric.score / metric.maxScore) * 100}%`,
                          backgroundColor: getScoreColor(metric.score)
                        }}
                      ></div>
                    </div>
                  </div>
                  <p className="metric-description">{metric.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="suggestions-tab">
            <div className="suggestions-list">
              {assessmentMetrics.map((metric) => (
                <div key={metric.id} className="suggestion-group">
                  <h4 className="suggestion-title">{metric.name}</h4>
                  <div className="suggestion-items">
                    {metric.suggestions?.map((suggestion, index) => (
                      <div 
                        key={index} 
                        className="suggestion-item clickable"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="suggestion-text">{suggestion.text}</div>
                        <div className="suggestion-excerpt">
                          <span className="excerpt-label">Excerpt:</span>
                          <span className="excerpt-text">"{suggestion.excerpt}"</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
