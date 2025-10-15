import { useState, useEffect } from 'react';
import ShellHeader from './ShellHeader';
import NavigationBar from './NavigationBar';
import ChatPanel from './ChatPanel';
import ContentArea, { type LibraryItem } from './ContentArea';
import ContentAssessmentPanel from './ContentAssessmentPanel';
import './ProjectDetailLayout.css';

export interface GeneratedContent {
  id: string;
  prompt: string;
  country: string;
  contentType: string;
  language: string;
  content: string;
  timestamp: Date;
}

// Helper function to translate content using Google Translate API
async function translateContentWithGoogle(content: string, targetLanguage: string): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY || '';
    
    if (!apiKey) {
      console.warn('Google Translate API key not found. Returning original content.');
      return content;
    }
    
    // Map language names to Google Translate language codes
    const languageCodeMap: { [key: string]: string } = {
      'Hindi': 'hi',
      'Spanish': 'es',
      'Spanish (MX)': 'es',
      'French': 'fr',
      'French (CA)': 'fr',
      'German': 'de',
      'Italian': 'it',
      'Japanese': 'ja',
      'Chinese (Simplified)': 'zh-CN',
      'Portuguese (BR)': 'pt',
      'Tamil': 'ta',
      'Telugu': 'te',
      'Bengali': 'bn',
      'Catalan': 'ca',
      'Basque': 'eu',
      'Galician': 'gl',
    };
    
    const targetCode = languageCodeMap[targetLanguage] || 'en';
    
    // Use Google Translate API
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: content,
        target: targetCode,
        source: 'en',
        format: 'text'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Translation API error:', response.status, errorData);
      return content; // Return original on error
    }

    const data = await response.json();
    const translatedText = data.data?.translations?.[0]?.translatedText || content;
    
    console.log(`Content translated to ${targetLanguage} (${targetCode})`);
    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return content; // Return original on error
  }
}

export default function ProjectDetailLayout() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['US']);
  const [selectedAssets, setSelectedAssets] = useState<string[]>(['blog-post']);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0); // Used to trigger reset in ChatPanel
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [highlightedExcerpt, setHighlightedExcerpt] = useState<{ start: number; end: number } | null>(null);

  const handleGenerateContent = async (prompt: string, country: string, contentType: string, language?: string) => {
    // Reset conversation history - each generation is fresh from accumulated prompt
    setConversationHistory([prompt]);
    
    setIsGenerating(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate content in English first
      const englishContent = generateContentForPrompt(prompt, country, contentType, 'English (US)', [prompt], null);
      
      // If non-English language is selected, translate the content
      const targetLanguage = language || 'English (US)';
      let finalContent = englishContent;
      
      if (targetLanguage !== 'English (US)' && targetLanguage !== 'English (UK)' && 
          targetLanguage !== 'English (CA)' && targetLanguage !== 'English (AU)' && 
          targetLanguage !== 'English') {
        finalContent = await translateContentWithGoogle(englishContent, targetLanguage);
      }
      
      setGeneratedContent({
        id: Date.now().toString(),
        prompt,
        country,
        contentType,
        language: targetLanguage,
        content: finalContent,
        timestamp: new Date(),
      });
      
      setIsGenerating(false);
    } catch (error) {
      console.error('Content generation error:', error);
      // Fallback to English content on error
      const content = generateContentForPrompt(prompt, country, contentType, language || 'English (US)', [prompt], null);
      setGeneratedContent({
        id: Date.now().toString(),
        prompt,
        country,
        contentType,
        language: language || 'English (US)',
        content,
        timestamp: new Date(),
      });
      setIsGenerating(false);
    }
  };

  const handleResetContent = () => {
    setGeneratedContent(null);
    setConversationHistory([]);
    setIsGenerating(false);
  };

  const handleFullReset = () => {
    // Reset all content and conversation history
    setGeneratedContent(null);
    setConversationHistory([]);
    setIsGenerating(false);
    
    // Trigger reset in ChatPanel by incrementing the trigger
    setResetTrigger(prev => prev + 1);
  };

  const handleAddToLibrary = (items: LibraryItem[]) => {
    setLibraryItems(prev => [...prev, ...items]);
    console.log(`Library updated: ${items.length} items added, total: ${libraryItems.length + items.length}`);
  };

  const handleDeleteFromLibrary = (itemId: string) => {
    setLibraryItems(prev => prev.filter(item => item.id !== itemId));
    console.log(`Item ${itemId} deleted from library`);
  };

  const handleHighlightExcerpt = (start: number, end: number) => {
    setHighlightedExcerpt({ start, end });
    // Clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedExcerpt(null);
    }, 3000);
  };

  // Auto-regenerate content when country or asset type changes
  useEffect(() => {
    // Only regenerate if content already exists (don't generate on initial mount)
    if (generatedContent && !isGenerating) {
      const newCountry = selectedCountries[0] || 'US';
      const newAsset = selectedAssets[0] || 'blog-post';
      
      // Check if country or asset type has changed
      const countryChanged = newCountry !== generatedContent.country;
      const assetChanged = newAsset !== generatedContent.contentType;
      
      if (countryChanged || assetChanged) {
        console.log(`Selection changed - Country: ${countryChanged ? generatedContent.country + ' → ' + newCountry : 'same'}, Asset: ${assetChanged ? generatedContent.contentType + ' → ' + newAsset : 'same'}`);
        
        // Regenerate content with the same prompt but new country/asset
        handleGenerateContent(
          generatedContent.prompt,
          newCountry,
          newAsset,
          generatedContent.language
        );
      }
    }
  }, [selectedCountries, selectedAssets]);

  return (
    <div className="project-detail-layout">
      <ShellHeader 
        selectedCountries={selectedCountries}
        setSelectedCountries={setSelectedCountries}
        selectedAssets={selectedAssets}
        setSelectedAssets={setSelectedAssets}
        onReset={handleFullReset}
      />
      <div className="content-section">
        <NavigationBar 
          showLibrary={showLibrary}
          onToggleLibrary={() => setShowLibrary(!showLibrary)}
          libraryItems={libraryItems}
        />
        <div className="canvas">
          {!showLibrary ? (
            <>
              <ChatPanel 
                onGenerateContent={handleGenerateContent}
                selectedCountries={selectedCountries}
                selectedAssets={selectedAssets}
                onResetContent={handleResetContent}
                resetTrigger={resetTrigger}
              />
              <ContentArea 
                selectedCountries={selectedCountries}
                selectedAssets={selectedAssets}
                generatedContent={generatedContent}
                isGenerating={isGenerating}
                onRegenerateContent={handleGenerateContent}
                onAddToLibrary={handleAddToLibrary}
                highlightedExcerpt={highlightedExcerpt}
              />
              {generatedContent && (
                <ContentAssessmentPanel 
                  generatedContent={generatedContent}
                  onHighlightExcerpt={handleHighlightExcerpt}
                />
              )}
            </>
          ) : (
            <div className="library-view">
              <h2>Asset Library</h2>
              {libraryItems.length === 0 ? (
                <div className="empty-library">
                  <p>No assets in library yet. Long press "Add to Library" button to add content.</p>
                </div>
              ) : (
                <table className="library-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Country</th>
                      <th>Asset Type</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {libraryItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{item.countryName}</td>
                        <td>{item.assetTypeName}</td>
                        <td>
                          <button
                            className="library-delete-button"
                            onClick={() => handleDeleteFromLibrary(item.id)}
                            title="Delete from library"
                            aria-label="Delete"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M3 4H13M5.5 4V3C5.5 2.44772 5.94772 2 6.5 2H9.5C10.0523 2 10.5 2.44772 10.5 3V4M6.5 7V11M9.5 7V11M4.5 4L5 13C5 13.5523 5.44772 14 6 14H10C10.5523 14 11 13.5523 11 13L11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to build structured context from template
function buildStructuredContext(prompt: string, country: string, contentType: string): string {
  const countryNames: { [key: string]: string } = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'ES': 'Spain',
    'IT': 'Italy',
    'JP': 'Japan',
    'CN': 'China',
    'IN': 'India',
    'BR': 'Brazil',
    'MX': 'Mexico',
  };

  const countryName = countryNames[country] || country;
  
  // Regional tone and cultural adaptation based on CONTENT_GENERATION_GUIDE.md
  const regionalTones: { [key: string]: string } = {
    'JP': '🇯🇵 Japan: Respectful, precise, subtle humor, references to tradition & craftsmanship',
    'BR': '🇧🇷 Brazil: Energetic, vibrant tone, community-oriented, emotional connection',
    'DE': '🇩🇪 Germany: Rational, structured tone, focus on efficiency & trustworthiness',
    'US': '🇺🇸 USA: Conversational, confident, individualistic, aspirational storytelling',
    'FR': '🇫🇷 France: Artistic, sophisticated, emotive storytelling, focus on experience',
    'IN': '🇮🇳 India: Expressive, aspirational tone, balance between modernity & culture',
    'ES': '🇪🇸 Spain: Warm, expressive, social connection, celebration-oriented',
    'IT': '🇮🇹 Italy: Passionate, quality-focused, lifestyle and heritage emphasis',
    'GB': '🇬🇧 UK: Witty, understated, trustworthy, balanced humor',
    'CA': '🇨🇦 Canada: Inclusive, friendly, community-minded, modest tone',
    'AU': '🇦🇺 Australia: Casual, straightforward, humor-driven, authentic',
    'MX': '🇲🇽 Mexico: Vibrant, family-oriented, celebratory, emotional',
    'CN': '🇨🇳 China: Harmonious, respectful, modern yet traditional, group-oriented',
  };
  
  const regionalTone = regionalTones[country] || 'Global: Neutral, relatable, culturally inclusive';
  
  // Determine which template to use based on content type
  if (contentType === 'blog-post') {
    // Use UNIVERSAL CONTENT GENERATION SPEC for blog post
    return `
# 🌍 UNIVERSAL CONTENT GENERATION SPEC - BLOGPOST

## SECTION 1: GLOBAL INSTRUCTION
**You are an expert marketing content creator** who understands global and local markets, cultural nuances, and digital storytelling.

Generate content that aligns with: **${countryName}, Blog Post Format**

## SECTION 2: CONTEXT VARIABLES
- **Country:** ${countryName}
- **Asset Type:** Blog Post (600-900 words)
- **Topic:** ${prompt}
- **Regional Tone:** ${regionalTone}

## SECTION 3: REGIONAL & CULTURAL ADAPTATION
${regionalTone}

**Cultural Requirements:**
- Reference local insights, trends, or traditions relevant to ${countryName}
- Use culturally resonant examples and metaphors
- Adapt tone to match ${countryName} communication style
- Consider seasonal, social, or current events in ${countryName}

## SECTION 4: BLOGPOST SPECIFICATIONS
**Length:** 600–900 words
**Structure:** 
1. **Title** - Localized and engaging for ${countryName}
2. **Hook** - Compelling opening that resonates culturally
3. **Insight** - Main value proposition with ${countryName} context
4. **Story/Example** - Relatable scenario for ${countryName} audience
5. **CTA** - Clear call-to-action

**Include:**
- 1–2 image suggestions with descriptions
- Author name and bio (appropriate for ${countryName})
- Cultural or contextual reference specific to ${countryName}

**Style:** Educational, informative, or lifestyle-driven based on topic

## SECTION 5: REQUIRED OUTPUT ELEMENTS
Every output must contain:
✓ A Title that feels localized and relevant to ${countryName}
✓ Images or visual suggestions with descriptions
✓ Author name and short bio appropriate for ${countryName}
✓ Cultural or contextual reference (mention or nod to local insight, trend, or tradition)

## PROMPT FOR GENERATION
Create a blog post about "${prompt}" for ${countryName} audiences.
Follow the cultural tone, structure, and requirements outlined above.
Ensure authenticity, cultural relevance, and engagement for ${countryName} readers.
  `.trim();
  } else if (contentType.includes('instagram') || contentType === 'instagram-reel' || contentType === 'instagram-story') {
    const isReel = contentType === 'instagram-reel';
    const isStory = contentType === 'instagram-story';
    
    // Use UNIVERSAL CONTENT GENERATION SPEC for social media
    return `
# 🌍 UNIVERSAL CONTENT GENERATION SPEC - ${isReel ? 'REEL' : isStory ? 'STORY' : 'SOCIAL POST'}

## SECTION 1: GLOBAL INSTRUCTION
**You are an expert marketing content creator** who understands global and local markets, cultural nuances, and digital storytelling.

Generate content that aligns with: **${countryName}, Instagram ${isReel ? 'Reel' : isStory ? 'Story' : 'Post'}**

## SECTION 2: CONTEXT VARIABLES
- **Country:** ${countryName}
- **Asset Type:** ${isReel ? 'Instagram Reel / Short Video' : isStory ? 'Instagram Story' : 'Instagram Social Post'}
- **Topic:** ${prompt}
- **Regional Tone:** ${regionalTone}

## SECTION 3: REGIONAL & CULTURAL ADAPTATION
${regionalTone}

**Cultural Requirements:**
- Use culturally resonant visuals and references for ${countryName}
- Adapt tone to match ${countryName} social media style
- Consider local trends, celebrations, or cultural moments
- Use appropriate emojis and hashtags for ${countryName}

${isStory ? `
## SECTION 4: INSTAGRAM STORY SPECIFICATIONS
**Frames:** 3–5
**Frame 1:** Hook line / question that grabs attention
**Frame 2–3:** Core message or insight with ${countryName} context
**Frame 4–5:** CTA or brand message

**Include:**
- Suggested imagery and visual direction for ${countryName}
- Color palette recommendations
- Relevant hashtags and location tags
- Interactive elements (polls, questions, stickers)

**Tone:** Energetic, relatable, platform-native for ${countryName}
` : isReel ? `
## SECTION 4: REEL / SHORT VIDEO SPECIFICATIONS
**Length:** 15–30 seconds
**Format:** Scene-by-scene script or storyboard

**Include:**
- Suggested visuals relevant to ${countryName}
- Captions and on-screen text
- Audio/music suggestions (trending in ${countryName})
- Hook in first 3 seconds

**Tone:** Energetic, relatable, platform-native, culturally adapted for ${countryName}
` : `
## SECTION 4: SOCIAL POST SPECIFICATIONS
**Length:** 100–200 words
**Structure:** 
1. **Hook** - Scroll-stopping opening
2. **Insight** - Value or entertainment
3. **CTA** - Clear call-to-action
4. **Hashtags** - Relevant to ${countryName}

**Tone:** Conversational, platform-native, culturally adapted for ${countryName}
`}

## SECTION 5: REQUIRED OUTPUT ELEMENTS
Every output must contain:
✓ Engaging caption localized for ${countryName}
✓ Visual suggestions with descriptions
✓ Hashtags relevant to ${countryName} and topic
✓ Cultural reference or nod to ${countryName} trends

## PROMPT FOR GENERATION
Create ${isReel ? 'a Reel script' : isStory ? 'an Instagram Story sequence' : 'an Instagram post'} about "${prompt}" for ${countryName} audiences.
Follow the cultural tone, structure, and platform requirements outlined above.
Ensure authenticity, cultural relevance, and high engagement potential for ${countryName} Instagram users.
  `.trim();
  } else if (contentType === 'article' || contentType.includes('article')) {
    // Use UNIVERSAL CONTENT GENERATION SPEC for articles
    return `
# 🌍 UNIVERSAL CONTENT GENERATION SPEC - ARTICLE

## SECTION 1: GLOBAL INSTRUCTION
**You are an expert marketing content creator** who understands global and local markets, cultural nuances, and digital storytelling.

Generate content that aligns with: **${countryName}, Long-form Article**

## SECTION 2: CONTEXT VARIABLES
- **Country:** ${countryName}
- **Asset Type:** Article (800-1200 words)
- **Topic:** ${prompt}
- **Regional Tone:** ${regionalTone}

## SECTION 3: REGIONAL & CULTURAL ADAPTATION
${regionalTone}

**Cultural Requirements:**
- Include data, statistics, or examples relevant to ${countryName}
- Reference local experts, studies, or authoritative sources
- Adapt analytical style to match ${countryName} preferences
- Consider journalistic standards and expectations in ${countryName}

## SECTION 4: ARTICLE SPECIFICATIONS
**Length:** 800–1200 words
**Structure:** 
1. **Title** - Newsworthy, localized for ${countryName}
2. **Subheadings** - Clear section breaks
3. **Data/Quotes** - Statistics and expert perspectives
4. **Conclusion** - Summary and implications for ${countryName}

**Include:**
- Statistics or data relevant to ${countryName}
- Expert quotes (real or simulated, appropriate for ${countryName})
- Visual data cues (charts, graphs suggestions)
- Author credentials appropriate for ${countryName}

**Style:** Analytical, journalistic, authoritative

## SECTION 5: REQUIRED OUTPUT ELEMENTS
Every output must contain:
✓ Professional title for ${countryName} readership
✓ Data points or statistics relevant to ${countryName}
✓ Expert voice or authoritative perspective
✓ Visual suggestions for data representation
✓ Author name with journalistic credentials for ${countryName}

## PROMPT FOR GENERATION
Create a long-form article about "${prompt}" for ${countryName} audiences.
Follow the journalistic tone, structure, and data-driven requirements outlined above.
Ensure credibility, cultural relevance, and analytical depth for ${countryName} readers.
  `.trim();
  }
  
  // Default/fallback template with Universal Spec guidance
  return `
# 🌍 UNIVERSAL CONTENT GENERATION SPEC - GENERAL

## SECTION 1: GLOBAL INSTRUCTION
**You are an expert marketing content creator** who understands global and local markets, cultural nuances, and digital storytelling.

Generate content that aligns with: **${countryName}, ${contentType}**

## SECTION 2: CONTEXT VARIABLES
- **Country:** ${countryName}
- **Asset Type:** ${contentType}
- **Topic:** ${prompt}
- **Regional Tone:** ${regionalTone}

## SECTION 3: REGIONAL & CULTURAL ADAPTATION
${regionalTone}

**Cultural Requirements:**
- Reference local insights, trends, or traditions relevant to ${countryName}
- Use culturally resonant examples and metaphors
- Adapt tone to match ${countryName} communication style
- Consider seasonal, social, or current events in ${countryName}

## SECTION 4: REQUIRED OUTPUT ELEMENTS
Every output must contain:
✓ A Title that feels localized and relevant to ${countryName}
✓ Content structured appropriately for ${contentType}
✓ Author name and bio appropriate for ${countryName}
✓ Cultural or contextual reference specific to ${countryName}

## PROMPT FOR GENERATION
Create ${contentType} content about "${prompt}" for ${countryName} audiences.
Follow the cultural tone and requirements outlined above.
Ensure authenticity, cultural relevance, and engagement for ${countryName} audiences.
  `.trim();
}

// Helper function to generate content based on prompt, country, and content type
function generateContentForPrompt(
  prompt: string, 
  country: string, 
  contentType: string,
  language: string,
  conversationHistory: string[],
  previousContent: GeneratedContent | null
): string {
  // This is a mock function - in production, this would call an AI API with the structured context
  const countryNames: { [key: string]: string } = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'ES': 'Spain',
    'IT': 'Italy',
    'JP': 'Japan',
    'CN': 'China',
    'IN': 'India',
    'BR': 'Brazil',
    'MX': 'Mexico',
  };

  const contentTypeNames: { [key: string]: string } = {
    'blog-post': 'Blog Post',
    'instagram': 'Instagram Post',
    'instagram-reel': 'Instagram Reel',
    'instagram-story': 'Instagram Story',
    'instagram-post': 'Instagram Post',
    'email': 'Email',
    'website': 'Website',
    'website-banner': 'Website Banner',
    'website-offer': 'Website Offer',
    'website-microsite': 'Microsite',
    'sms': 'SMS',
  };

  const countryName = countryNames[country] || country;
  const contentTypeName = contentTypeNames[contentType] || contentType;
  
  // Build structured context for AI
  const structuredContext = buildStructuredContext(prompt, country, contentType);
  console.log('Structured Context for AI:', structuredContext);

  // Translate content based on language
  const translatedContent = translateContent(prompt, countryName, contentTypeName, language, contentType);
  if (translatedContent) return translatedContent;

  // Check if this is a follow-up that modifies existing content
  const isFollowUp = conversationHistory.length > 1 && previousContent;
  
  // Handle follow-up prompts that refine or modify content
  if (isFollowUp) {
    const lowerPrompt = prompt.toLowerCase();
    
    // Check for specific modification requests
    if (lowerPrompt.includes('shorter') || lowerPrompt.includes('brief') || lowerPrompt.includes('concise')) {
      return generateShorterVersion(previousContent!.content, countryName, contentTypeName);
    }
    if (lowerPrompt.includes('longer') || lowerPrompt.includes('more detail') || lowerPrompt.includes('expand')) {
      return generateLongerVersion(previousContent!.content, prompt, countryName, contentTypeName);
    }
    if (lowerPrompt.includes('focus on') || lowerPrompt.includes('emphasize') || lowerPrompt.includes('highlight')) {
      return generateFocusedVersion(previousContent!.content, prompt, countryName, contentTypeName);
    }
    if (lowerPrompt.includes('add') || lowerPrompt.includes('include')) {
      return generateWithAddition(previousContent!.content, prompt, countryName, contentTypeName);
    }
    if (lowerPrompt.includes('remove') || lowerPrompt.includes('without') || lowerPrompt.includes('exclude')) {
      return generateWithRemoval(previousContent!.content, prompt, countryName, contentTypeName);
    }
    if (lowerPrompt.includes('tone') || lowerPrompt.includes('style') || lowerPrompt.includes('professional') || lowerPrompt.includes('casual')) {
      return generateWithToneChange(previousContent!.content, prompt, countryName, contentTypeName);
    }
    
    // If no specific modification detected, regenerate with new prompt
    // Fall through to normal generation
  }

  // Generate content based on the actual user prompt
  // In production, this would be replaced with an actual ChatGPT API call
  // For now, we'll create a generic template that uses the user's prompt directly
  
  const systemContext = `You are creating ${contentTypeName} content for the ${countryName} market in ${language}. 
Target audience: ${countryName} consumers
Content type: ${contentTypeName}
Language: ${language}

Create engaging, culturally appropriate content that resonates with ${countryName} audiences.`;

  // This is a placeholder - replace with actual ChatGPT API call
  // Example API call would be:
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4",
  //   messages: [
  //     { role: "system", content: systemContext },
  //     { role: "user", content: prompt }
  //   ]
  // });
  
  if (contentType === 'blog-post') {
    // Generate realistic, engaging blog content
    const topicWords = prompt.toLowerCase();
    
    // Create varied, realistic content based on topic
    let intro, section1, section2, section3, conclusion;
    
    if (topicWords.includes('health') || topicWords.includes('wellness') || topicWords.includes('drink') || topicWords.includes('benefit')) {
      intro = `In today's fast-paced world, ${countryName} consumers are increasingly focused on wellness and making informed health choices. ${prompt} has emerged as a topic of significant interest, particularly as people seek natural, effective solutions that fit their lifestyle.`;
      section1 = `## Understanding the Science\n\nRecent research has shed new light on this topic, with studies showing promising results for ${countryName} consumers. Health professionals emphasize the importance of understanding both the benefits and considerations when exploring ${prompt}.\n\n**Key Research Findings:**\n- Clinical studies demonstrate measurable effects\n- Natural ingredients align with consumer preferences\n- Growing body of evidence supports traditional use\n- Safety profiles meet ${countryName} regulatory standards`;
      section2 = `## Real-World Applications\n\nFor ${countryName} residents, integrating these insights into daily life doesn't have to be complicated. Here's what wellness experts recommend:\n\n**Morning Routine:**\nStart your day with mindful choices that support your health goals. Many ${countryName} consumers report positive changes within 2-3 weeks of consistent practice.\n\n**Throughout the Day:**\nMaintain balance by listening to your body and adjusting as needed. What works in other markets may need slight adaptation for ${countryName}'s unique climate and lifestyle patterns.`;
      section3 = `## Expert Perspectives\n\nWe spoke with Dr. ${country === 'JP' ? 'Yamamoto' : country === 'DE' ? 'Schmidt' : country === 'FR' ? 'Dubois' : country === 'BR' ? 'Silva' : 'Anderson'}, a leading nutritionist in ${countryName}, who shared: *"The key is consistency and quality. ${countryName} consumers should look for products that meet local standards and align with their personal health objectives."*\n\n**Consumer Success Stories:**\nThousands of ${countryName} customers have shared their positive experiences, noting improvements in energy levels, overall well-being, and daily vitality.`;
      conclusion = `## Your Path Forward\n\nWhether you're just beginning to explore ${prompt} or looking to deepen your understanding, the ${countryName} market offers excellent resources and options.\n\n**Next Steps:**\n1. Consult with healthcare professionals familiar with ${countryName} practices\n2. Start with quality products from reputable ${countryName} sources\n3. Track your progress and adjust based on your individual response\n4. Connect with the growing ${countryName} community interested in wellness\n\n*Remember: Individual results may vary. This content is for informational purposes and doesn't replace professional medical advice.*`;
    } else if (topicWords.includes('celebrat') || topicWords.includes('party') || topicWords.includes('event') || topicWords.includes('festiv')) {
      intro = `Celebrations bring people together, and in ${countryName}, these moments hold special cultural significance. Whether planning an intimate gathering or a large-scale event, understanding ${prompt} helps create memorable experiences that resonate with local traditions and modern expectations.`;
      section1 = `## Planning the Perfect ${countryName} Celebration\n\n**Cultural Considerations:**\nIn ${countryName}, celebrations reflect unique values and traditions. ${country === 'BR' ? 'The vibrant, community-focused spirit means including music, dance, and plenty of socializing.' : country === 'JP' ? 'Attention to detail and respect for tradition create harmonious, meaningful gatherings.' : country === 'DE' ? 'Efficiency and quality matter—well-organized events with premium offerings impress guests.' : country === 'US' ? 'Personal expression and spectacular moments make celebrations memorable and Instagram-worthy.' : 'Local customs and preferences shape successful events.'}\n\n**Timing & Atmosphere:**\n${country === 'BR' ? 'Late start times (9 PM or later) are common, with parties extending into early morning hours.' : country === 'JP' ? 'Punctuality matters. Events typically start and end as scheduled, with careful attention to seasons.' : country === 'DE' ? 'Precise scheduling is appreciated. Guests expect events to start and end as indicated.' : country === 'US' ? 'Flexibility with timing, but strong emphasis on creating buzz-worthy moments for social sharing.' : 'Understanding local timing expectations ensures better attendance and engagement.'}`;
      section2 = `## What ${countryName} Guests Expect\n\n**Food & Beverages:**\n${country === 'BR' ? '- Abundant variety with options for grazing throughout the night\n- Signature cocktails featuring local ingredients\n- Multiple food stations encouraging mingling\n- Tropical fruits and fresh, colorful presentations' : country === 'JP' ? '- Beautifully presented dishes with attention to seasonality\n- Balance of traditional and contemporary options\n- Considerate portions showing restraint and elegance\n- Premium quality over quantity' : country === 'DE' ? '- High-quality ingredients, especially beer and meats\n- Hearty portions reflecting value and substance\n- Efficient service and well-organized flow\n- Traditional favorites alongside modern options' : '- Variety to accommodate dietary preferences\n- Instagram-worthy presentation\n- Convenient serving styles\n- Balance of familiar and adventurous options'}\n\n**Entertainment:**\nMusic and activities should reflect ${countryName} tastes while encouraging connection and enjoyment.`;
      section3 = `## Making It Memorable\n\n**The ${countryName} Touch:**\nSuccessful celebrations in ${countryName} share common elements:\n- Attention to local preferences and expectations\n- Balance between tradition and innovation\n- Comfortable atmosphere encouraging genuine connection\n- Thoughtful details that show cultural awareness\n\n**Budget Considerations:**\nIn ${countryName}, typical celebration budgets vary, but quality always trumps quantity. Invest in elements that matter most to your guests.`;
      conclusion = `## Create Your Celebration\n\nReady to plan something special? ${countryName} offers wonderful venues, vendors, and inspiration.\n\n**Essential Checklist:**\n✓ Confirm venue availability well in advance\n✓ Source ${countryName}-based suppliers who understand local preferences\n✓ Plan entertainment that reflects your guests' cultural background\n✓ Prepare for ${countryName} weather and seasonal considerations\n✓ Include personal touches that make your event unique\n\n*Start planning 3-6 months ahead for best results and availability in ${countryName}.*`;
    } else {
      // Generic high-quality content for other topics
      intro = `${prompt.charAt(0).toUpperCase() + prompt.slice(1)} represents an important consideration for ${countryName} audiences. In this comprehensive guide, we'll explore the key aspects that matter most, backed by insights from ${countryName} experts and real-world examples that resonate locally.`;
      section1 = `## The ${countryName} Context\n\nUnderstanding ${prompt} in ${countryName} requires looking beyond global trends to local nuances. Here's what makes the ${countryName} market unique:\n\n**Market Dynamics:**\n${countryName} consumers approach this topic differently than other markets. ${country === 'US' ? 'Innovation and individuality drive choices, with consumers willing to pay premium prices for quality and convenience.' : country === 'DE' ? 'Thoroughness and quality matter more than speed. Consumers research extensively before making decisions.' : country === 'JP' ? 'Long-term relationships and trust outweigh short-term trends. Brand reputation carries significant weight.' : country === 'BR' ? 'Social proof and community recommendations heavily influence adoption and success.' : 'Local preferences and values shape consumer behavior significantly.'}\n\n**Current Trends:**\nRecent data from ${countryName} shows growing interest and engagement, with industry experts predicting continued expansion in coming years.`;
      section2 = `## Practical Applications\n\nFor ${countryName} consumers, here's how ${prompt} translates into real-world value:\n\n**Key Benefits:**\n- **Relevance:** Solutions tailored specifically for ${countryName} market conditions\n- **Accessibility:** Growing availability through ${countryName}-based providers\n- **Support:** Local customer service and ${countryName}-specific resources\n- **Community:** Connection with other ${countryName} users and experiences\n\n**Implementation Tips:**\nStart small and scale based on results. What works in test phases often performs even better at full scale in ${countryName}.`;
      section3 = `## Expert Insights\n\n${countryName} professionals emphasize several critical factors for success:\n\n**Quality Over Speed:**\nRushing implementation often leads to suboptimal results. Take time to understand ${countryName}-specific requirements.\n\n**Cultural Fit:**\nSolutions that work globally need local adaptation. ${countryName} consumers appreciate providers who understand their unique needs.\n\n**Continuous Improvement:**\nThe ${countryName} market evolves constantly. Stay informed about local developments and adjust accordingly.`;
      conclusion = `## Moving Forward\n\nWhether you're new to ${prompt} or looking to optimize your approach, the ${countryName} market offers excellent opportunities for those who understand local dynamics.\n\n**Recommended Actions:**\n1. Research ${countryName}-specific providers and solutions\n2. Connect with local experts who understand the market\n3. Start with pilot programs before full rollout\n4. Monitor results and adjust based on ${countryName} feedback\n5. Stay engaged with the ${countryName} community\n\n*Success in ${countryName} comes from combining global best practices with local insight and cultural awareness.*`;
    }
    
    return `## ${prompt.charAt(0).toUpperCase() + prompt.slice(1)}: A ${countryName} Perspective\n\n${intro}\n\n${section1}\n\n${section2}\n\n${section3}\n\n${conclusion}\n\n---\n\n*${contentTypeName} crafted for ${countryName} audiences | ${language}*\n\n**Author:** ${country === 'JP' ? 'Yuki Tanaka' : country === 'DE' ? 'Klaus Müller' : country === 'FR' ? 'Marie Dubois' : country === 'BR' ? 'Ana Silva' : country === 'ES' ? 'Carlos Rodriguez' : country === 'IT' ? 'Marco Rossi' : country === 'IN' ? 'Priya Sharma' : country === 'CN' ? 'Wei Zhang' : country === 'MX' ? 'Sofia Martinez' : country === 'AU' ? 'James Wilson' : country === 'CA' ? 'Sarah Chen' : country === 'GB' ? 'Oliver Thompson' : 'Alex Johnson'}, ${contentTypeName === 'Blog Post' ? 'Senior Content Specialist' : 'Marketing Writer'} | ${countryName}`;
  } else if (contentType.includes('instagram')) {
    // Generate engaging, realistic Instagram content
    const isReel = contentType === 'instagram-reel';
    const isStory = contentType === 'instagram-story';
    const topicWords = prompt.toLowerCase();
    
    let caption, visualDirection, audioSuggestion;
    
    if (topicWords.includes('health') || topicWords.includes('wellness') || topicWords.includes('drink') || topicWords.includes('benefit')) {
      caption = isReel 
        ? `The truth about ${prompt}? It's simpler than you think.\n\n${country === 'US' ? 'Boost your wellness game' : country === 'BR' ? 'Transforme sua energia diaria' : country === 'JP' ? 'Transform your daily health routine' : 'Transform your daily routine'} with these science-backed insights.\n\n${country === 'US' ? 'Drop a comment if you are ready to level up!' : country === 'BR' ? 'Comenta aqui qual seu maior desafio!' : country === 'JP' ? 'Comment and share your thoughts!' : 'Comment below if this resonates!'}\n\n#WellnessJourney #HealthyLiving #${countryName.replace(/\s/g, '')}Wellness`
        : isStory
        ? `POLL: Have you tried ${prompt}?\n\nTap to vote!\n\nStay tuned for results + expert tips\n\n#${countryName.replace(/\s/g, '')}Health #WellnessTips`
        : `${prompt.charAt(0).toUpperCase() + prompt.slice(1)}\n\n${country === 'US' ? 'Your body deserves the best. Here is what the science says...' : country === 'BR' ? 'Seu corpo merece o melhor. Veja o que a ciencia diz...' : country === 'JP' ? 'Transform your health with science-backed insights' : 'Discover what research reveals...'}\n\n- Natural ingredients\n- Proven results\n- ${countryName}-approved\n\n${country === 'US' ? 'Tag someone who needs to see this!' : country === 'BR' ? 'Marca aquele amigo!' : country === 'JP' ? 'Share with friends!' : 'Share with your community!'}\n\n#HealthyLifestyle #Wellness #${countryName.replace(/\s/g, '')}Health`;
      
      visualDirection = isReel
        ? `**Visual Concept:** Clean, bright aesthetic with nature elements\n- Opening shot: Dynamic transition with product/concept reveal\n- Mid-section: Quick cuts showing daily wellness routine\n- Closing: Clear benefit statement with ${countryName} context\n- Color palette: Fresh greens, warm earth tones, bright whites`
        : isStory
        ? `**Visual Concept:** Interactive story sequence\n- Frame 1: Eye-catching statistic or question\n- Frame 2-3: Educational content with swipe-up prompts\n- Frame 4: Poll or quiz for engagement\n- Frame 5: CTA with link sticker\n- Design: Clean, minimal, on-brand colors`
        : `**Visual Concept:** Lifestyle photography\n- Hero image: Natural setting, ${country === 'BR' ? 'beach or tropical vibes' : country === 'JP' ? 'zen garden or minimalist aesthetic' : country === 'DE' ? 'modern, clean environment' : 'bright, aspirational lifestyle'}\n- Composition: Product/concept as focal point, lifestyle context\n- Lighting: Natural, bright, inviting\n- ${countryName} elements: Subtle local cultural touches`;
      
      audioSuggestion = isReel ? `\n\n**Audio:** ${country === 'US' ? 'Trending upbeat pop or lo-fi beats' : country === 'BR' ? 'Brazilian pop, samba-influenced beats, or trending funk' : country === 'JP' ? 'Calming instrumental or J-pop trending audio' : country === 'DE' ? 'Electronic, house, or indie pop' : 'Upbeat, positive trending audio'} - Check ${countryName} trending sounds for maximum reach` : '';
    } else if (topicWords.includes('celebrat') || topicWords.includes('party') || topicWords.includes('event') || topicWords.includes('festiv')) {
      caption = isReel
        ? `${prompt.toUpperCase()}\n\n${country === 'BR' ? 'A energia que voce precisa para celebrar!' : country === 'US' ? 'The energy you need to celebrate right!' : country === 'JP' ? 'Make the best moments' : 'Make every moment count!'}\n\nSwipe to see how ${countryName} does it best\n\n${country === 'BR' ? 'Marca seus amigos!' : country === 'US' ? 'Tag your crew!' : country === 'JP' ? 'Tag your friends!' : 'Tag your squad!'}\n\n#PartyTime #${countryName.replace(/\s/g, '')}Vibes #Celebration`
        : isStory
        ? `${prompt.toUpperCase()}\n\n${country === 'BR' ? 'BORA?' : country === 'US' ? 'YOU IN?' : country === 'JP' ? 'Join us?' : 'JOIN US?'}\n\nTap for details\n\n#${countryName.replace(/\s/g, '')}Party`
        : `Ready for ${prompt}?\n\n${country === 'BR' ? 'Energia, diversao e muita vibe boa!' : country === 'US' ? 'Good vibes, great company, unforgettable moments' : country === 'JP' ? 'Create wonderful memories' : 'Create memories that last forever'}\n\n${country === 'BR' ? 'Bora celebrar?' : country === 'US' ? 'Who is ready to celebrate?' : country === 'JP' ? 'Celebrate together' : 'Let us celebrate together!'}\n\n#PartyVibes #${countryName.replace(/\s/g, '')}Celebration #GoodTimes`;
      
      visualDirection = isReel
        ? `**Visual Concept:** High-energy, dynamic celebration footage\n- Opening: Bass drop with party reveal\n- Mid-section: Quick cuts of people enjoying, ${country === 'BR' ? 'dancing, beach vibes' : country === 'US' ? 'confetti, toasting, dancing' : country === 'JP' ? 'lanterns, refined gathering' : 'celebration highlights'}\n- Closing: Group shot with strong CTA\n- Vibe: ${country === 'BR' ? 'Carnival energy, vibrant colors' : country === 'US' ? 'Bold, bright, Instagram-worthy' : country === 'JP' ? 'Elegant, beautiful, harmonious' : 'Fun, energetic, memorable'}`
        : isStory
        ? `**Visual Concept:** Behind-the-scenes celebration content\n- Frame 1: Teaser - "Something special coming..."\n- Frame 2-3: Setup shots, preparations\n- Frame 4: Countdown or poll - "Will you join?"\n- Frame 5: Event details with link\n- Style: Authentic, spontaneous, FOMO-inducing`
        : `**Visual Concept:** Celebration lifestyle shot\n- Setting: ${country === 'BR' ? 'Beach party or outdoor celebration' : country === 'US' ? 'Backyard BBQ or rooftop party' : country === 'JP' ? 'Seasonal gathering or refined event' : 'Festive gathering'}\n- People: Friends enjoying, candid moments\n- Products: Naturally integrated\n- Mood: ${country === 'BR' ? 'Energetic, colorful, joyful' : country === 'US' ? 'Fun, aspirational, shareable' : country === 'JP' ? 'Beautiful, harmonious, memorable' : 'Warm, inviting, celebratory'}`;
      
      audioSuggestion = isReel ? `\n\n**Audio:** ${country === 'BR' ? 'Trending Brazilian funk, sertanejo, or pagode' : country === 'US' ? 'Pop hits, dance tracks, or viral sounds' : country === 'JP' ? 'J-pop, trending city pop, or upbeat tracks' : 'Upbeat party music or trending celebration sounds'}` : '';
    } else {
      caption = isReel
        ? `${prompt} explained in 30 seconds\n\n${country === 'US' ? 'No fluff, just facts.' : country === 'BR' ? 'Direto ao ponto!' : country === 'JP' ? 'Simple and clear' : 'Clear and concise.'} ${countryName} edition\n\nSave this for later!\n\n#${prompt.replace(/\s/g, '')} #${countryName.replace(/\s/g, '')}Content #Learn`
        : isStory
        ? `${prompt.toUpperCase()}\n\nSwipe up to learn more\n\n#${countryName.replace(/\s/g, '')} #KnowledgeSharing`
        : `${prompt.charAt(0).toUpperCase() + prompt.slice(1)}\n\n${country === 'US' ? 'Here is what you need to know...' : country === 'BR' ? 'Aqui esta o que voce precisa saber...' : country === 'JP' ? 'Essential knowledge for you' : 'Essential insights...'}\n\n${country === 'US' ? 'Double tap if this helped!' : country === 'BR' ? 'Deixa o like se ajudou!' : country === 'JP' ? 'Like if helpful!' : 'Like if you found this useful!'}\n\n#${prompt.replace(/\s/g, '')} #${countryName.replace(/\s/g, '')}Community`;
      
      visualDirection = isReel
        ? `**Visual Concept:** Educational, clean presentation\n- Opening: Hook with question or surprising fact\n- Mid-section: Key points with text overlays\n- Closing: Summary and CTA\n- Style: Professional yet approachable, ${countryName}-relevant visuals`
        : isStory
        ? `**Visual Concept:** Information sequence\n- Frame 1: Attention-grabbing stat or question\n- Frame 2-3: Educational slides with key points\n- Frame 4: Interactive element (quiz/poll)\n- Frame 5: Resource link or CTA\n- Design: Clean, readable, branded`
        : `**Visual Concept:** Informative carousel or single\n- Layout: Clean, structured, easy to read\n- Elements: Charts, infographics, or lifestyle integration\n- Branding: Subtle, professional\n- ${countryName} touch: Local references or examples`;
      
      audioSuggestion = isReel ? `\n\n**Audio:** ${country === 'US' ? 'Lo-fi, calm beats for educational content' : country === 'BR' ? 'Smooth bossa nova or chill beats' : country === 'JP' ? 'Calm instrumental or ambient sounds' : 'Gentle, non-distracting background music'}` : '';
    }
    
    return `## Instagram ${isReel ? 'Reel' : isStory ? 'Story' : 'Post'} - ${prompt.charAt(0).toUpperCase() + prompt.slice(1)}\n\n### Caption\n\n${caption}\n\n---\n\n### Visual Direction\n\n${visualDirection}${audioSuggestion}\n\n**Technical Specs:**\n${isReel ? '- Duration: 15-30 seconds\n- Format: 9:16 vertical video\n- Resolution: 1080x1920px\n- Frame rate: 30fps minimum' : isStory ? '- Format: 9:16 vertical\n- Resolution: 1080x1920px\n- Duration: 3-15 seconds per frame\n- File size: Under 4MB per frame' : '- Format: Square (1:1) or Vertical (4:5)\n- Resolution: 1080x1080px or 1080x1350px\n- File type: JPG or PNG\n- File size: Under 1MB'}\n\n**${countryName} Optimization:**\n${country === 'BR' ? '- Post timing: 7-9 PM (peak engagement)\n- Use Portuguese naturally\n- Include local slang and expressions\n- Encourage community interaction' : country === 'US' ? '- Post timing: 11 AM - 1 PM or 7-9 PM ET\n- Hashtag strategy: Mix popular + niche\n- Encourage UGC and sharing\n- Include strong CTAs' : country === 'JP' ? '- Post timing: 12-1 PM or 7-9 PM JST\n- Respect for aesthetics and quality\n- Subtle, elegant messaging\n- Seasonal awareness' : country === 'DE' ? '- Post timing: 6-8 PM CET\n- Value quality over frequency\n- Authentic, trustworthy content\n- Clear, organized presentation' : '- Research local peak times\n- Adapt language and tone\n- Use relevant local hashtags\n- Consider cultural context'}\n\n---\n\n*${contentTypeName} crafted for ${countryName} Instagram audiences | ${language}*\n\n**Created by:** ${country === 'BR' ? 'Ana Silva' : country === 'US' ? 'Alex Johnson' : country === 'JP' ? 'Yuki Tanaka' : country === 'DE' ? 'Klaus Müller' : country === 'FR' ? 'Marie Dubois' : 'Social Media Team'}, Social Media Strategist | ${countryName}`;
  } else if (contentType === 'email') {
    return `**Subject Line:** Important Information About ${prompt}

---

## Email Body

Hello,

We're excited to share valuable information about ${prompt}, specifically for our ${countryName} audience.

**Key Highlights:**

📌 Relevant to ${countryName} market  
📌 Tailored content for you  
📌 Important insights and information  
📌 Actionable takeaways

**What This Means for You**

${prompt} is an important topic for our ${countryName} customers. We've created this content specifically with your needs in mind.

[Call to Action Button]

Best regards,  
The Team

---

*Email content generated for ${countryName} market in ${language}*`;
  } else if (contentType === 'sms') {
    return `**Message:**

${prompt} - Important update for ${countryName} customers. Learn more at [link]

---

*SMS content - ${countryName} market*
*Character count: ${60 + prompt.length + countryName.length}*`;
  } else {
    return `## ${prompt}

**Content Type:** ${contentTypeName}  
**Target Market:** ${countryName}  
**Language:** ${language}

### Overview

This content about "${prompt}" has been created specifically for ${countryName} audiences, taking into account local preferences and cultural context.

### Key Information

- **Topic**: ${prompt}
- **Market**: ${countryName} 
- **Content Format**: ${contentTypeName}
- **Target Audience**: ${countryName} consumers

### Main Content

${prompt} is presented here in a format suitable for ${countryName} audiences. The content has been tailored to match local expectations and preferences.

**Important Points:**
1. Culturally relevant for ${countryName}
2. Appropriate content format: ${contentTypeName}
3. Localized for ${countryName} market
4. Available in ${language}

---

*Generated ${contentTypeName} for ${countryName} market | ${language}*`;
  }
}

// Helper functions for content modifications

function generateShorterVersion(originalContent: string, countryName: string, contentTypeName: string): string {
  // Extract key sections from the original content
  const lines = originalContent.split('\n').filter(line => line.trim());
  const mainHeading = lines[0];
  
  // Extract main points (lines starting with - or numbered lists)
  const bulletPoints = lines.filter(line => 
    line.trim().startsWith('-') || /^\d+\./.test(line.trim())
  ).slice(0, 5); // Keep top 5 points
  
  // Extract section headings (## or ###)
  const sections = lines.filter(line => 
    line.trim().startsWith('##') && !line.includes('[Generated')
  ).slice(0, 3); // Keep first 3 main sections
  
  return `${mainHeading}

## Summary

This condensed version focuses on the essential information for ${countryName} audiences.

### Key Points

${bulletPoints.length > 0 ? bulletPoints.join('\n') : `- Core information about ${mainHeading.replace(/^#+\s*/, '')}
- Tailored for ${countryName} market
- Essential details and highlights`}

### Main Sections Covered

${sections.map(s => s.replace(/^#+\s*/, '- ')).join('\n') || `- Introduction\n- Key benefits\n- Conclusion`}

---

*Concise ${contentTypeName} for ${countryName} market*`;
}

function generateLongerVersion(originalContent: string, prompt: string, countryName: string, contentTypeName: string): string {
  // Keep the original content and expand on it
  const lines = originalContent.split('\n').filter(line => line.trim());
  const mainHeading = lines[0];
  const topic = mainHeading.replace(/^#+\s*/, '');
  
  // Extract existing sections to expand upon
  const existingSections = lines.filter(line => line.trim().startsWith('##'));
  
  return `${originalContent}

## Additional Context

This expanded version provides more detailed information about ${topic} for the ${countryName} market.

### Deeper Insights

${topic} encompasses various aspects that are important for ${countryName} audiences:

- **In-Depth Analysis**: Comprehensive examination of key factors
- **Market-Specific Context**: How this applies specifically to ${countryName}
- **Practical Applications**: Real-world implementation strategies
- **Best Practices**: Proven approaches for ${countryName} market

### Extended Discussion

For ${countryName} audiences, understanding the nuances of ${topic} is crucial. This includes:

1. **Detailed Background**: Historical context and current trends in ${countryName}
2. **Implementation Strategies**: Step-by-step guidance tailored for ${countryName}
3. **Case Studies**: Examples from ${countryName} market
4. **Future Outlook**: Projections and opportunities for ${countryName}

### Regional Considerations

When applying ${topic} in ${countryName}, it's important to consider:

- Local market dynamics and consumer behavior
- Cultural preferences and expectations
- Regulatory environment and compliance requirements
- Competitive landscape in ${countryName}

## Additional Resources

For ${countryName} audiences seeking more information about ${topic}:
- Further research and studies relevant to ${countryName}
- Expert insights from ${countryName} industry leaders
- Community discussions and forums

---

*Extended ${contentTypeName} for ${countryName} market with additional detail*`;
}

function generateFocusedVersion(originalContent: string, prompt: string, countryName: string, contentTypeName: string): string {
  const lines = originalContent.split('\n').filter(line => line.trim());
  const mainHeading = lines[0];
  const topic = mainHeading.replace(/^#+\s*/, '');
  
  // Extract what the user wants to focus on
  const focusArea = prompt.toLowerCase()
    .replace(/focus on |emphasize |highlight |more about |tell me about /gi, '')
    .trim();
  
  // Find relevant sections in original content that mention the focus area
  const relevantLines = lines.filter(line => 
    line.toLowerCase().includes(focusArea.toLowerCase())
  );
  
  return `${mainHeading}

## Focused Analysis: ${focusArea.charAt(0).toUpperCase() + focusArea.slice(1)}

This version emphasizes **${focusArea}** as it relates to ${topic} for ${countryName} audiences.

### Why ${focusArea.charAt(0).toUpperCase() + focusArea.slice(1)} Matters

When considering ${topic} in the ${countryName} market, ${focusArea} plays a crucial role:

${relevantLines.length > 0 ? relevantLines.slice(0, 3).join('\n') : `- Central to understanding ${topic}
- Particularly relevant for ${countryName} market
- Key differentiator and success factor`}

### In-Depth Look at ${focusArea.charAt(0).toUpperCase() + focusArea.slice(1)}

For ${countryName} audiences, ${focusArea} represents an important aspect of ${topic}:

- **Core Importance**: How ${focusArea} impacts ${topic} in ${countryName}
- **Regional Context**: ${focusArea} considerations specific to ${countryName}
- **Practical Impact**: Real-world implications of ${focusArea}
- **Best Practices**: Optimal approaches to ${focusArea} in ${countryName}

### Key Takeaways

Understanding ${focusArea} in the context of ${topic} helps ${countryName} audiences:

1. Make better-informed decisions
2. Align with local market expectations
3. Maximize value and effectiveness
4. Stay ahead of regional trends

---

*Focused ${contentTypeName} for ${countryName} | Emphasis on: ${focusArea}*`;
}

function generateWithAddition(originalContent: string, prompt: string, countryName: string, contentTypeName: string): string {
  const lines = originalContent.split('\n');
  const mainHeading = lines[0];
  const topic = mainHeading.replace(/^#+\s*/, '');
  
  // Extract what the user wants to add
  const addition = prompt.toLowerCase()
    .replace(/add |include |also add |also include |talk about |mention /gi, '')
    .trim();
  
  return `${originalContent}

## Additional Topic: ${addition.charAt(0).toUpperCase() + addition.slice(1)}

Based on your request, here's additional information about **${addition}** in relation to ${topic}:

### Overview of ${addition.charAt(0).toUpperCase() + addition.slice(1)}

${addition.charAt(0).toUpperCase() + addition.slice(1)} is an important consideration for ${countryName} audiences exploring ${topic}.

### Key Aspects

- **Relevance**: How ${addition} connects to ${topic}
- **${countryName} Context**: Specific implications for the ${countryName} market
- **Practical Value**: Real-world applications and benefits
- **Integration**: How ${addition} fits with the main discussion

### Why This Matters for ${countryName}

Understanding ${addition} alongside ${topic} provides ${countryName} audiences with:

1. A more complete picture of the subject matter
2. Additional context for decision-making
3. Market-specific insights
4. Actionable information

---

*Updated ${contentTypeName} with additional content about: ${addition}*`;
}

function generateWithRemoval(originalContent: string, prompt: string, countryName: string, contentTypeName: string): string {
  const lines = originalContent.split('\n').filter(line => line.trim());
  const mainHeading = lines[0];
  const topic = mainHeading.replace(/^#+\s*/, '');
  
  // Extract what the user wants to remove
  const toRemove = prompt.toLowerCase()
    .replace(/remove |without |exclude |don't include |skip |omit /gi, '')
    .trim();
  
  // Filter out lines that contain the removal topic
  const filteredLines = lines.filter(line => 
    !line.toLowerCase().includes(toRemove.toLowerCase())
  );
  
  // Keep main sections but simplified
  const mainSections = filteredLines.filter(line => 
    line.trim().startsWith('##') && !line.includes('[Generated')
  );
  
  return `${mainHeading}

## Revised Content

This version has been updated based on your request to exclude content about **${toRemove}**.

${filteredLines.slice(1, Math.min(15, filteredLines.length)).join('\n')}

## Summary

This streamlined version of ${topic} for ${countryName} focuses on the essential information, with ${toRemove} excluded as requested.

---

*Refined ${contentTypeName} for ${countryName} | Removed: ${toRemove}*`;
}

function generateWithToneChange(originalContent: string, prompt: string, countryName: string, contentTypeName: string): string {
  const lines = originalContent.split('\n').filter(line => line.trim());
  const mainHeading = lines[0];
  const topic = mainHeading.replace(/^#+\s*/, '');
  const lowerPrompt = prompt.toLowerCase();
  
  // Extract key bullet points and sections from original
  const bulletPoints = lines.filter(line => 
    line.trim().startsWith('-') || /^\d+\./.test(line.trim())
  ).slice(0, 3);
  
  const sections = lines.filter(line => 
    line.trim().startsWith('##') && !line.includes('[Generated')
  ).map(s => s.replace(/^#+\s*/, '')).slice(0, 3);
  
  if (lowerPrompt.includes('casual') || lowerPrompt.includes('friendly') || lowerPrompt.includes('conversational')) {
    return `# ${topic}

Hey there! 👋

Let's talk about ${topic} - especially how it relates to folks in ${countryName}.

## Here's What You Need to Know

${sections.length > 0 ? sections.map(s => `**${s}**: This is an important part of ${topic} that matters for ${countryName} audiences.`).join('\n\n') : `${topic} is something that really makes a difference for people in ${countryName}. Let's break down why it's worth your attention.`}

### The Key Points

${bulletPoints.length > 0 ? bulletPoints.join('\n') : `- It's relevant to ${countryName} market
- It's practical and useful
- It's worth understanding`}

## Bottom Line

${topic} is worth paying attention to, especially if you're in ${countryName}. It's straightforward, practical, and designed with your needs in mind.

---

*Casual, friendly ${contentTypeName} for ${countryName} market*`;
  } else {
    // Professional tone
    return `${mainHeading}

## Executive Overview

This document presents a professional analysis of ${topic} for the ${countryName} market, designed for stakeholders and decision-makers.

## Strategic Context

${topic} represents a significant area of focus for organizations and individuals in ${countryName}. This professional assessment provides the analytical framework for informed decision-making.

## Key Findings

${sections.length > 0 ? sections.map(s => `### ${s}\n\nThis aspect of ${topic} requires careful consideration within the ${countryName} market context.`).join('\n\n') : `### Market Analysis\n\n${topic} demonstrates relevance to ${countryName} stakeholders through multiple dimensions.`}

### Supporting Evidence

${bulletPoints.length > 0 ? bulletPoints.join('\n') : `- Demonstrated value in ${countryName} market
- Alignment with regional requirements
- Proven effectiveness and reliability`}

## Strategic Recommendations

For ${countryName} organizations and professionals:

1. **Assessment**: Evaluate ${topic} within your specific context
2. **Planning**: Develop implementation strategies aligned with ${countryName} market conditions
3. **Execution**: Apply best practices tailored to ${countryName}
4. **Measurement**: Track outcomes and adjust approach as needed

## Conclusion

This professional analysis of ${topic} provides ${countryName} stakeholders with the information necessary for strategic decision-making.

---

*Professional ${contentTypeName} for ${countryName} market*`;
  }
}

// Translation function for different languages
function translateContent(prompt: string, countryName: string, contentTypeName: string, language: string, contentType: string): string | null {
  // German
  if (language.includes('German')) {
    if (contentType === 'blog-post') {
      return `## ${prompt}

**[Generierter Inhalt für den ${countryName}-Markt]**

Dieser Blogbeitrag über "${prompt}" wurde für das Publikum in ${countryName} angepasst. Nachfolgend finden Sie einen umfassenden Leitfaden zu den wichtigsten Aspekten dieses Themas.

## Einführung

${prompt} ist ein wichtiges Thema für das Publikum in ${countryName}. Dieser Inhalt bietet wertvolle Einblicke und praktische Informationen, die speziell für den ${countryName}-Markt relevant sind.

## Hauptpunkte

### Themenübersicht
${prompt} umfasst mehrere wichtige Aspekte, die besonders für Verbraucher in ${countryName} relevant sind:

- **Kulturelle Relevanz**: Angepasst an die Präferenzen des ${countryName}-Marktes
- **Lokaler Kontext**: Berücksichtigt ${countryName}-spezifische Faktoren
- **Markteinblicke**: Zugeschnitten auf die Bedürfnisse des ${countryName}-Publikums

### Wichtige Überlegungen

Bei der Betrachtung von ${prompt} auf dem ${countryName}-Markt ist es wichtig zu berücksichtigen:

1. **Regionale Präferenzen**: Verstehen, was beim ${countryName}-Publikum Anklang findet
2. **Markttrends**: Aktuelle Entwicklungen in ${countryName}
3. **Verbraucherverhalten**: Wie ${countryName}-Verbraucher dieses Thema angehen

## Detaillierte Analyse

${prompt} bietet mehrere Möglichkeiten und Überlegungen für den ${countryName}-Markt. Der Ansatz sollte auf lokale Präferenzen zugeschnitten sein und gleichzeitig globale Best Practices beibehalten.

### Vorteile und Nutzen

Die wichtigsten Vorteile von ${prompt} für ${countryName}-Verbraucher umfassen:
- Relevanz für lokale Marktbedingungen
- Ausrichtung auf ${countryName}-Verbrauchererwartungen
- Anpassung an kulturelle Nuancen

## Fazit

${prompt} stellt einen wichtigen Bereich für das ${countryName}-Publikum dar. Dieser Inhalt wurde speziell erstellt, um die einzigartigen Bedürfnisse und Präferenzen des ${countryName}-Marktes zu adressieren.

---

*Generiert ${contentTypeName} für ${countryName} | Sprache: ${language}*`;
    }
  }
  
  // Spanish
  if (language.includes('Spanish')) {
    if (contentType === 'blog-post') {
      return `## ${prompt}

**[Contenido generado para el mercado de ${countryName}]**

Esta publicación de blog sobre "${prompt}" ha sido adaptada para el público de ${countryName}. A continuación, encontrará una guía completa que cubre los aspectos clave de este tema.

## Introducción

${prompt} es un tema importante para el público de ${countryName}. Este contenido proporciona información valiosa y práctica específicamente relevante para el mercado de ${countryName}.

## Puntos Clave

### Descripción General del Tema
${prompt} abarca varios aspectos importantes que son particularmente relevantes para los consumidores de ${countryName}:

- **Relevancia Cultural**: Adaptado a las preferencias del mercado de ${countryName}
- **Contexto Local**: Considera factores específicos de ${countryName}
- **Perspectivas del Mercado**: Adaptado a las necesidades del público de ${countryName}

### Consideraciones Importantes

Al explorar ${prompt} en el mercado de ${countryName}, es importante considerar:

1. **Preferencias Regionales**: Comprender lo que resuena con el público de ${countryName}
2. **Tendencias del Mercado**: Desarrollos actuales en ${countryName}
3. **Comportamiento del Consumidor**: Cómo los consumidores de ${countryName} abordan este tema

## Análisis Detallado

${prompt} ofrece varias oportunidades y consideraciones para el mercado de ${countryName}. El enfoque debe adaptarse a las preferencias locales mientras se mantienen las mejores prácticas globales.

### Beneficios y Ventajas

Las principales ventajas de ${prompt} para los consumidores de ${countryName} incluyen:
- Relevancia para las condiciones del mercado local
- Alineación con las expectativas del consumidor de ${countryName}
- Adaptación a los matices culturales

## Conclusión

${prompt} representa un área importante para el público de ${countryName}. Este contenido ha sido creado específicamente para abordar las necesidades y preferencias únicas del mercado de ${countryName}.

---

*Generado ${contentTypeName} para ${countryName} | Idioma: ${language}*`;
    }
  }
  
  // French
  if (language.includes('French')) {
    if (contentType === 'blog-post') {
      return `## ${prompt}

**[Contenu généré pour le marché de ${countryName}]**

Cet article de blog sur "${prompt}" a été adapté pour le public de ${countryName}. Vous trouverez ci-dessous un guide complet couvrant les aspects clés de ce sujet.

## Introduction

${prompt} est un sujet important pour le public de ${countryName}. Ce contenu fournit des informations précieuses et pratiques spécifiquement pertinentes pour le marché de ${countryName}.

## Points Clés

### Aperçu du Sujet
${prompt} englobe plusieurs aspects importants qui sont particulièrement pertinents pour les consommateurs de ${countryName}:

- **Pertinence Culturelle**: Adapté aux préférences du marché de ${countryName}
- **Contexte Local**: Prend en compte les facteurs spécifiques à ${countryName}
- **Perspectives du Marché**: Adapté aux besoins du public de ${countryName}

### Considérations Importantes

Lors de l'exploration de ${prompt} sur le marché de ${countryName}, il est important de considérer:

1. **Préférences Régionales**: Comprendre ce qui résonne avec le public de ${countryName}
2. **Tendances du Marché**: Développements actuels dans ${countryName}
3. **Comportement des Consommateurs**: Comment les consommateurs de ${countryName} abordent ce sujet

## Analyse Détaillée

${prompt} offre plusieurs opportunités et considérations pour le marché de ${countryName}. L'approche doit être adaptée aux préférences locales tout en maintenant les meilleures pratiques mondiales.

### Avantages et Bénéfices

Les principaux avantages de ${prompt} pour les consommateurs de ${countryName} incluent:
- Pertinence pour les conditions du marché local
- Alignement avec les attentes des consommateurs de ${countryName}
- Adaptation aux nuances culturelles

## Conclusion

${prompt} représente un domaine important pour le public de ${countryName}. Ce contenu a été spécifiquement créé pour répondre aux besoins et préférences uniques du marché de ${countryName}.

---

*Généré ${contentTypeName} pour ${countryName} | Langue: ${language}*`;
    }
  }
  
  // Japanese
  if (language.includes('Japanese')) {
    if (contentType === 'blog-post') {
      return `## ${prompt}

**[${countryName}市場向けに生成されたコンテンツ]**

「${prompt}」に関するこのブログ投稿は、${countryName}の視聴者向けに調整されています。以下は、このトピックの重要な側面をカバーする包括的なガイドです。

## はじめに

${prompt}は、${countryName}の視聴者にとって重要なトピックです。このコンテンツは、${countryName}市場に特に関連する貴重な洞察と実用的な情報を提供します。

## 主なポイント

### トピックの概要
${prompt}は、${countryName}の消費者に特に関連するいくつかの重要な側面を含んでいます：

- **文化的関連性**: ${countryName}市場の嗜好に適応
- **地域的背景**: ${countryName}特有の要因を考慮
- **市場洞察**: ${countryName}の視聴者のニーズに合わせて調整

### 重要な考慮事項

${countryName}市場で${prompt}を探求する際、以下を考慮することが重要です：

1. **地域の嗜好**: ${countryName}の視聴者に共鳴するものを理解する
2. **市場トレンド**: ${countryName}での現在の動向
3. **消費者行動**: ${countryName}の消費者がこのトピックにどのようにアプローチするか

## 詳細な分析

${prompt}は、${countryName}市場にいくつかの機会と考慮事項を提供します。アプローチは、グローバルなベストプラクティスを維持しながら、地域の嗜好に合わせて調整する必要があります。

### 利点とメリット

${countryName}の消費者にとっての${prompt}の主な利点は次のとおりです：
- 地域市場状況への関連性
- ${countryName}の消費者期待との整合性
- 文化的なニュアンスへの適応

## まとめ

${prompt}は、${countryName}の視聴者にとって重要な分野を表しています。このコンテンツは、${countryName}市場の独自のニーズと嗜好に対応するために特別に作成されました。

---

*${countryName}向けに生成された${contentTypeName} | 言語: ${language}*`;
    }
  }

  // Chinese
  if (language.includes('Chinese')) {
    if (contentType === 'blog-post') {
      return `## ${prompt}

**[为${countryName}市场生成的内容]**

关于"${prompt}"的这篇博客文章已针对${countryName}的受众进行了调整。以下是涵盖本主题关键方面的综合指南。

## 简介

${prompt}是${countryName}受众的重要话题。此内容提供了专门与${countryName}市场相关的宝贵见解和实用信息。

## 要点

### 主题概述
${prompt}涵盖了与${countryName}消费者特别相关的几个重要方面：

- **文化相关性**：适应${countryName}市场偏好
- **本地背景**：考虑${countryName}特定因素
- **市场洞察**：针对${countryName}受众需求量身定制

### 重要考虑因素

在${countryName}市场探索${prompt}时，重要的是要考虑：

1. **区域偏好**：了解${countryName}受众的共鸣点
2. **市场趋势**：${countryName}的当前发展
3. **消费者行为**：${countryName}消费者如何处理这个话题

## 详细分析

${prompt}为${countryName}市场提供了多种机会和考虑因素。方法应该针对当地偏好进行调整，同时保持全球最佳实践。

### 优势和好处

${prompt}对${countryName}消费者的主要优势包括：
- 与当地市场条件的相关性
- 与${countryName}消费者期望保持一致
- 适应文化细微差别

## 结论

${prompt}代表了${countryName}受众的一个重要领域。此内容是专门为满足${countryName}市场的独特需求和偏好而创建的。

---

*为${countryName}生成的${contentTypeName} | 语言: ${language}*`;
    }
  }

  return null; // Return null if no translation needed (defaults to English)
}
