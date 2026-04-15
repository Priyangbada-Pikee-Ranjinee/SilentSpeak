<?php
/**
 * AI Integration API for Silent Speak
 * Provides AI-powered caption enhancement, grammar correction, summarization, and translation
 */
 
require_once __DIR__ . '/../config.php';

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    sendError('Method not allowed', 405);
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'enhance':
        enhanceCaption();
        break;
    case 'summarize':
        summarizeText();
        break;
    case 'translate':
        translateText();
        break;
    case 'correct':
        correctGrammar();
        break;
    case 'simplify':
        simplifyText();
        break;
    default:
        sendError('Invalid action specified', 400);
}

/**
 * Enhance caption with AI
 */
function enhanceCaption() {
    $user = requireAuth();
    
    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['text'])) {
        sendError('Text is required', 400);
    }
    
    $text = $data['text'];
    $language = $data['language'] ?? 'en';
    $enhancementType = $data['type'] ?? 'all'; // all, grammar, clarity, formal
    
    // Simulate AI processing delay
    sleep(1);
    
    // Mock AI enhancement
    $enhancedText = mockAIEnhancement($text, $language, $enhancementType);
    
    sendSuccess([
        'original' => $text,
        'enhanced' => $enhancedText,
        'language' => $language,
        'type' => $enhancementType,
        'confidence' => 0.85,
        'changes' => [
            'grammar_corrections' => rand(1, 5),
            'clarity_improvements' => rand(1, 3),
            'word_replacements' => rand(0, 2)
        ]
    ], 'Caption enhanced successfully');
}

/**
 * Summarize text with AI
 */
function summarizeText() {
    $user = requireAuth();
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['text'])) {
        sendError('Text is required', 400);
    }
    
    $text = $data['text'];
    $maxLength = $data['max_length'] ?? 100;
    $language = $data['language'] ?? 'en';
    
    sleep(1); // Simulate processing
    
    // Mock summarization
    $summary = mockAISummarization($text, $maxLength, $language);
    
    sendSuccess([
        'original' => $text,
        'summary' => $summary,
        'original_length' => strlen($text),
        'summary_length' => strlen($summary),
        'compression_ratio' => round(strlen($summary) / max(strlen($text), 1) * 100, 1) . '%'
    ], 'Text summarized successfully');
}

/**
 * Translate text with AI
 */
function translateText() {
    $user = requireAuth();
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['text'])) {
        sendError('Text is required', 400);
    }
    
    $text = $data['text'];
    $sourceLang = $data['source_lang'] ?? 'en';
    $targetLang = $data['target_lang'] ?? 'bn'; // Default to Bangla
    
    sleep(1);
    
    // Mock translation
    $translation = mockAITranslation($text, $sourceLang, $targetLang);
    
    sendSuccess([
        'original' => $text,
        'translation' => $translation,
        'source_language' => $sourceLang,
        'target_language' => $targetLang,
        'confidence' => 0.92
    ], 'Text translated successfully');
}

/**
 * Correct grammar with AI
 */
function correctGrammar() {
    $user = requireAuth();
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['text'])) {
        sendError('Text is required', 400);
    }
    
    $text = $data['text'];
    $language = $data['language'] ?? 'en';
    
    sleep(1);
    
    // Mock grammar correction
    $corrected = mockAIGrammarCorrection($text, $language);
    
    sendSuccess([
        'original' => $text,
        'corrected' => $corrected,
        'language' => $language,
        'errors_fixed' => rand(1, 7),
        'suggestions' => [
            'Use active voice',
            'Consider shorter sentences',
            'Check subject-verb agreement'
        ]
    ], 'Grammar corrected successfully');
}

/**
 * Simplify text for accessibility
 */
function simplifyText() {
    $user = requireAuth();
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['text'])) {
        sendError('Text is required', 400);
    }
    
    $text = $data['text'];
    $language = $data['language'] ?? 'en';
    $readingLevel = $data['reading_level'] ?? 'basic'; // basic, intermediate, advanced
    
    sleep(1);
    
    // Mock text simplification
    $simplified = mockAISimplification($text, $language, $readingLevel);
    
    sendSuccess([
        'original' => $text,
        'simplified' => $simplified,
        'language' => $language,
        'reading_level' => $readingLevel,
        'complexity_reduction' => rand(20, 60) . '%',
        'readability_score' => rand(65, 95) . '/100'
    ], 'Text simplified successfully');
}

/**
 * Mock AI enhancement function
 */
function mockAIEnhancement($text, $language, $type) {
    $enhancements = [
        'grammar' => [
            'i goes to school' => 'I go to school',
            'she dont like it' => 'she doesn\'t like it',
            'they was happy' => 'they were happy',
            'he have a car' => 'he has a car',
            'we is going' => 'we are going'
        ],
        'clarity' => [
            'make it better' => 'improve the quality',
            'do the thing' => 'complete the task',
            'get it done' => 'accomplish the objective',
            'fix the problem' => 'resolve the issue',
            'look at it' => 'examine the item'
        ],
        'formal' => [
            'hey guys' => 'Hello everyone',
            'thanks a lot' => 'Thank you very much',
            'no problem' => 'You\'re welcome',
            'gonna' => 'going to',
            'wanna' => 'want to'
        ]
    ];
    
    $enhancedText = $text;
    
    // Apply random enhancements based on type
    if ($type === 'all' || $type === 'grammar') {
        foreach ($enhancements['grammar'] as $wrong => $correct) {
            if (stripos($enhancedText, $wrong) !== false) {
                $enhancedText = str_ireplace($wrong, $correct, $enhancedText);
            }
        }
    }
    
    if ($type === 'all' || $type === 'clarity') {
        foreach ($enhancements['clarity'] as $vague => $clear) {
            if (stripos($enhancedText, $vague) !== false) {
                $enhancedText = str_ireplace($vague, $clear, $enhancedText);
            }
        }
    }
    
    if ($type === 'all' || $type === 'formal') {
        foreach ($enhancements['formal'] as $informal => $formal) {
            if (stripos($enhancedText, $informal) !== false) {
                $enhancedText = str_ireplace($informal, $formal, $enhancedText);
            }
        }
    }
    
    // Capitalize first letter
    $enhancedText = ucfirst(trim($enhancedText));
    
    // Add period if missing
    if (!in_array(substr($enhancedText, -1), ['.', '!', '?'])) {
        $enhancedText .= '.';
    }
    
    return $enhancedText;
}

/**
 * Mock AI summarization function
 */
function mockAISummarization($text, $maxLength, $language) {
    $words = str_word_count($text, 1);
    $wordCount = count($words);
    
    if ($wordCount <= 10) {
        return $text; // Too short to summarize
    }
    
    // Extract key sentences (mock)
    $sentences = preg_split('/[.!?]+/', $text);
    $sentences = array_filter($sentences, 'trim');
    
    if (count($sentences) <= 1) {
        // Single sentence, just truncate
        return substr($text, 0, $maxLength) . (strlen($text) > $maxLength ? '...' : '');
    }
    
    // Mock summary: first and last sentence
    $summary = trim($sentences[0]) . '. ' . trim(end($sentences)) . '.';
    
    if (strlen($summary) > $maxLength) {
        $summary = substr($summary, 0, $maxLength - 3) . '...';
    }
    
    return $summary;
}

/**
 * Mock AI translation function
 */
function mockAITranslation($text, $sourceLang, $targetLang) {
    // Mock translations for common phrases
    $translations = [
        'en' => [
            'bn' => [
                'hello' => 'হ্যালো',
                'thank you' => 'ধন্যবাদ',
                'good morning' => 'সুপ্রভাত',
                'how are you' => 'আপনি কেমন আছেন',
                'i need help' => 'আমার সাহায্য প্রয়োজন',
                'please repeat' => 'দয়া করে পুনরাবৃত্তি করুন',
                'i understand' => 'আমি বুঝতে পেরেছি',
                'teacher' => 'শিক্ষক',
                'student' => 'ছাত্র',
                'class' => 'ক্লাস',
                'today we will learn' => 'আজ আমরা শিখব',
                'important information' => 'গুরুত্বপূর্ণ তথ্য',
                'please pay attention' => 'দয়া করে মনোযোগ দিন',
                'any questions' => 'কোনো প্রশ্ন আছে'
            ],
            'es' => [
                'hello' => 'hola',
                'thank you' => 'gracias',
                'good morning' => 'buenos días',
                'how are you' => 'cómo estás',
                'i need help' => 'necesito ayuda'
            ]
        ]
    ];
    
    $textLower = strtolower($text);
    $translated = $text;
    
    // Check if we have translations for this language pair
    if (isset($translations[$sourceLang][$targetLang])) {
        $dict = $translations[$sourceLang][$targetLang];
        
        foreach ($dict as $english => $foreign) {
            if (stripos($textLower, $english) !== false) {
                $translated = str_ireplace($english, $foreign, $translated);
            }
        }
        
        // If no translation found, add a mock prefix
        if ($translated === $text && $targetLang === 'bn') {
            $translated = "[বাংলা অনুবাদ] " . $text;
        }
    } else {
        $translated = "[$targetLang translation] " . $text;
    }
    
    return $translated;
}

/**
 * Mock AI grammar correction
 */
function mockAIGrammarCorrection($text, $language) {
    return mockAIEnhancement($text, $language, 'grammar');
}

/**
 * Mock AI text simplification
 */
function mockAISimplification($text, $language, $readingLevel) {
    $simplified = $text;
    
    // Replace complex words with simpler ones
    $complexWords = [
        'utilize' => 'use',
        'approximately' => 'about',
        'demonstrate' => 'show',
        'facilitate' => 'help',
        'implement' => 'do',
        'methodology' => 'method',
        'optimal' => 'best',
        'parameters' => 'settings',
        'subsequently' => 'later',
        'terminate' => 'end'
    ];
    
    foreach ($complexWords as $complex => $simple) {
        if (stripos($simplified, $complex) !== false) {
            $simplified = str_ireplace($complex, $simple, $simplified);
        }
    }
    
    // Shorten long sentences for basic reading level
    if ($readingLevel === 'basic') {
        $sentences = preg_split('/[.!?]+/', $simplified);
        if (count($sentences) > 2) {
            $simplified = $sentences[0] . '. ' . $sentences[1] . '.';
        }
    }
    
    return $simplified;
}
?>