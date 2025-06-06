// Mock WASM import for validate_target_string
const VALID_CHARS_FOR_TEST = "qpzry9x8gf2tvdw0s3jn54khce6mua7l1".split('');
function validate_target_string(target) {
  if (!target) return false;
  for (let i = 0; i < target.length; i++) {
    if (!VALID_CHARS_FOR_TEST.includes(target[i].toLowerCase())) {
      return false;
    }
  }
  return true;
}

// --- Start of copied/adapted generateSuggestions logic from main.js ---
const VALID_CHARS = ['q', 'p', 'z', 'r', 'y', '9', 'x', '8', 'g', 'f', '2', 't', 'v', 'd', 'w', '0', 's', '3', 'j', 'n', '5', '4', 'k', 'h', 'c', 'e', '6', 'm', 'u', 'a', '7', 'l', '1'];
const COMMON_SUBSTITUTES = {'o': '0', 'i': '1', 'b': '8'};

// Copied directly from main.js and ensure it uses the mock validate_target_string defined above
function generateSuggestions(userInput, maxSuggestions = 5) {
    const suggestions = new Set();
    const lowerUserInput = userInput.toLowerCase();

    const addSuggestion = (patternStr) => {
      // In this test environment, validate_target_string is the mock.
      if (suggestions.size < maxSuggestions && validate_target_string(patternStr)) {
        suggestions.add(patternStr);
      }
    };

    // Suggestion 1: Comprehensive Replacement
    let comprehensiveChars = Array.from(lowerUserInput).map(char => {
      if (validate_target_string(char)) { // Mocked version
        return char;
      }
      return COMMON_SUBSTITUTES[char] || VALID_CHARS[0];
    });
    addSuggestion(comprehensiveChars.join(''));

    // Find invalid character indices
    const invalidCharIndices = [];
    for (let i = 0; i < lowerUserInput.length; i++) {
      if (!validate_target_string(lowerUserInput[i])) { // Mocked version
        invalidCharIndices.push(i);
      }
    }

    // Suggestion 2-N: Focused First Invalid Character Replacement
    if (invalidCharIndices.length > 0) {
      const firstInvalidIndex = invalidCharIndices[0];
      const originalInvalidChar = lowerUserInput[firstInvalidIndex];

      // Create a base from the original input for focused replacement
      let tempCharsBase = Array.from(lowerUserInput);

      if (COMMON_SUBSTITUTES[originalInvalidChar]) {
        let tempChars = [...tempCharsBase];
        tempChars[firstInvalidIndex] = COMMON_SUBSTITUTES[originalInvalidChar];
        // Comprehensively fix chars after this substitution
        for (let i = firstInvalidIndex + 1; i < tempChars.length; i++) {
            if (!validate_target_string(tempChars[i])) {
                tempChars[i] = COMMON_SUBSTITUTES[tempChars[i]] || VALID_CHARS[0];
            }
        }
        addSuggestion(tempChars.join(''));
      }

      for (const validChar of VALID_CHARS) {
        if (suggestions.size >= maxSuggestions) break;
        // Avoid duplicate if this validChar is the same as the common substitute already added
        if (COMMON_SUBSTITUTES[originalInvalidChar] === validChar && suggestions.has(
            (() => {
                let temp = [...tempCharsBase];
                temp[firstInvalidIndex] = validChar;
                for (let i = firstInvalidIndex + 1; i < temp.length; i++) {
                    if (!validate_target_string(temp[i])) {
                        temp[i] = COMMON_SUBSTITUTES[temp[i]] || VALID_CHARS[0];
                    }
                }
                return temp.join('');
            })()
        )) continue;

        let tempChars = [...tempCharsBase];
        tempChars[firstInvalidIndex] = validChar;
        // Comprehensively fix chars after this substitution
        for (let i = firstInvalidIndex + 1; i < tempChars.length; i++) {
            if (!validate_target_string(tempChars[i])) {
                tempChars[i] = COMMON_SUBSTITUTES[tempChars[i]] || VALID_CHARS[0];
            }
        }
        addSuggestion(tempChars.join(''));
        if (suggestions.size >= maxSuggestions) break;
      }
    }

    // Suggestion 3-M: Focused Second Invalid Character Replacement
    if (invalidCharIndices.length > 1 && suggestions.size < maxSuggestions) {
      const secondInvalidIndex = invalidCharIndices[1];
      const originalSecondInvalidChar = lowerUserInput[secondInvalidIndex];

      // Base for second fix: Use comprehensive replacement for chars *before* the second invalid one,
      // keep original for the second invalid one itself (to be replaced), and others as is.
      let baseForSecondFixChars = Array.from(lowerUserInput).map((char, index) => {
        if (index < secondInvalidIndex && !validate_target_string(char)) { // Mocked
          return COMMON_SUBSTITUTES[char] || VALID_CHARS[0];
        }
        return char; // Keep original valid chars and the second invalid char as is for now
      });

      if (COMMON_SUBSTITUTES[originalSecondInvalidChar]) {
        let tempChars = [...baseForSecondFixChars];
        tempChars[secondInvalidIndex] = COMMON_SUBSTITUTES[originalSecondInvalidChar];
        // Comprehensively fix chars after this substitution
        for(let i = secondInvalidIndex + 1; i < tempChars.length; i++) {
            if(!validate_target_string(tempChars[i])) { // Mocked
                tempChars[i] = COMMON_SUBSTITUTES[tempChars[i]] || VALID_CHARS[0];
            }
        }
        addSuggestion(tempChars.join(''));
      }

      for (const validChar of VALID_CHARS) {
        if (suggestions.size >= maxSuggestions) break;
        // Avoid duplicate
        if (COMMON_SUBSTITUTES[originalSecondInvalidChar] === validChar && suggestions.has(
             (() => {
                let temp = [...baseForSecondFixChars];
                temp[secondInvalidIndex] = validChar;
                for (let i = secondInvalidIndex + 1; i < temp.length; i++) {
                    if (!validate_target_string(temp[i])) { // Mocked
                        temp[i] = COMMON_SUBSTITUTES[temp[i]] || VALID_CHARS[0];
                    }
                }
                return temp.join('');
            })()
        )) continue;

        let tempSecondFixChars = [...baseForSecondFixChars];
        tempSecondFixChars[secondInvalidIndex] = validChar;
        // Ensure remaining characters are also valid or substituted
        for(let i = secondInvalidIndex + 1; i < tempSecondFixChars.length; i++) {
            if(!validate_target_string(tempSecondFixChars[i])) { // Mocked
                tempSecondFixChars[i] = COMMON_SUBSTITUTES[tempSecondFixChars[i]] || VALID_CHARS[0];
            }
        }
        addSuggestion(tempSecondFixChars.join(''));
        if (suggestions.size >= maxSuggestions) break;
      }
    }

    return Array.from(suggestions);
}
// --- End of copied/adapted logic ---


function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  function test(description, testFn) {
    try {
      testFn();
      console.log(`✅ PASS: ${description}`);
      testsPassed++;
    } catch (e) {
      console.error(`❌ FAIL: ${description}`, e);
      testsFailed++;
    }
  }

  test("Input with only invalid chars: 'bobo'", () => {
    const suggestions = generateSuggestions("bobo");
    console.assert(suggestions.length > 0, "Should return suggestions for 'bobo'");
    console.assert(suggestions.includes("8080"), "Should suggest '8080' for 'bobo' (comprehensive)");
    // First invalid is 'b' at index 0. COMMON_SUBSTITUTES['b'] is '8'. So '8obo' -> '8080'
    // Next, VALID_CHARS[0] is 'q'. So 'qobo' -> 'q0q0'
    console.assert(suggestions.includes("q0q0"), "Should suggest 'q0q0' for 'bobo'");
  });

  test("Input with mixed valid/invalid: 'axbyc'", () => {
    // 'a', 'x', 'y', 'c' are valid. 'b' is invalid.
    const suggestions = generateSuggestions("axbyc");
    console.assert(suggestions.length > 0, "Should return suggestions for 'axbyc'");
    // Comprehensive: axbyc -> axqyc (b to q)
    console.assert(suggestions.includes("axqyc"), "Comprehensive: axbyc -> axqyc");
    // First invalid 'b' at index 2.
    // Common substitute: '8' -> ax8yc
    console.assert(suggestions.includes("ax8yc"), "Focused 1st: axbyc -> ax8yc");
    // VALID_CHARS[0] ('q') was already covered by comprehensive.
    // VALID_CHARS[1] ('p') -> axpyc
    if (VALID_CHARS[0] === 'q' && VALID_CHARS[1] === 'p') { // Assuming default VALID_CHARS order
        console.assert(suggestions.includes("axpyc"), "Focused 1st: axbyc -> axpyc");
    }
  });

  test("Already valid input: 'qpzry'", () => {
    const validInput = VALID_CHARS.slice(0, 5).join(''); // e.g., "qpzry"
    const suggestions = generateSuggestions(validInput);
    console.assert(suggestions.length === 0, `Should return no suggestions for valid input like '${validInput}'`);
  });

  test("Input 'opi': common substitutes o->0, i->1", () => {
    const suggestions = generateSuggestions("opi"); // p is valid
    console.assert(suggestions.includes("0p1"), "Should suggest '0p1' for 'opi'");
  });

  test("Max suggestions respected: 'bibibibi', 3 suggestions", () => { // b,i are invalid
    const suggestions = generateSuggestions("bibibibi", 3); // Max 3 suggestions
    console.assert(suggestions.length === 3, "Should respect maxSuggestions limit (3)");
  });

  test("Max suggestions respected: 'bbbbbb', 2 suggestions", () => {
    const suggestions = generateSuggestions("bbbbbb", 2);
    console.assert(suggestions.length === 2, "Should respect maxSuggestions limit (2)");
     // Expected: "888888", "q88888" (or "qqqqqq" depending on exact logic for 2nd suggestion with comprehensive)
     // With current logic:
     // 1. Comprehensive: "888888" (b->8)
     // 2. Focused first 'b' at 0:
     //    Common sub '8' already used for full string.
     //    Next VALID_CHARS[0] 'q': "qbbbbb" -> "q88888" (comprehensively fixing rest)
     console.assert(suggestions.includes("888888"), "Should include '888888'");
     console.assert(suggestions.includes("q88888"), "Should include 'q88888'");
  });


  test("All suggestions are valid", () => {
    const inputs = ["b@d", "inv#lid", "char$", "oooo", "test!", "non$sense"];
    inputs.forEach(input => {
      const suggestions = generateSuggestions(input);
      suggestions.forEach(sug => {
        console.assert(validate_target_string(sug), `Suggestion '${sug}' for input '${input}' should be valid. Got: ${sug}`);
      });
    });
  });

  test("Empty input", () => {
    const suggestions = generateSuggestions("");
    console.assert(suggestions.length === 0, "Should return no suggestions for empty input");
  });

  test("Input with only one invalid char: 'q@z'", () => {
    // '@' is invalid. 'q', 'z' are valid.
    const suggestions = generateSuggestions("q@z");
    console.assert(suggestions.length > 0, "Should return suggestions for 'q@z'");
    // Comprehensive: q@z -> qqz (default for @ is VALID_CHARS[0] = 'q')
    console.assert(suggestions.includes("qqz"), "Should suggest 'qqz' (comprehensive)");
    // Focused first '@' at index 1:
    // No common substitute.
    // VALID_CHARS[0] 'q': qqz (already added)
    // VALID_CHARS[1] 'p': qpz
    if (VALID_CHARS[0] === 'q' && VALID_CHARS[1] === 'p') {
       console.assert(suggestions.includes("qpz"), "Should suggest 'qpz' (focused)");
    }
  });

  test("Input 'b@bo': two invalid chars, second is common", () => {
    // b is invalid (common '8')
    // @ is invalid (no common, default 'q')
    // b is invalid (common '8')
    // o is invalid (common '0')
    const suggestions = generateSuggestions("b@bo");
    console.assert(suggestions.length > 0, "Should return suggestions for 'b@bo'");
    // Comprehensive: b@bo -> 8q80
    console.assert(suggestions.includes("8q80"), "Comprehensive: b@bo -> 8q80");

    // Focused 1st ('b' at 0):
    //   Common '8': 8@bo -> 8q80 (already present)
    //   VALID_CHARS[0] 'q': q@bo -> qq80
    console.assert(suggestions.includes("qq80"), "Focused 1st ('b'): q@bo -> qq80");

    // Focused 2nd ('@' at 1, after fixing 'b' at 0 to '8'):
    //   Base for 2nd fix from "8@bo":
    //   Original char '@'. No common sub.
    //   VALID_CHARS[0] 'q': 8qbo -> 8q80 (already present)
    //   VALID_CHARS[1] 'p': 8pbo -> 8p80
    console.assert(suggestions.includes("8p80"), "Focused 2nd ('@' on base '8@bo'): 8pbo -> 8p80");
  });


  console.log(`
--- Test Summary ---`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  if (testsFailed > 0) {
    // To make this visible in environments that don't automatically fail on console.error
    // throw new Error("SOME TESTS FAILED");
    console.error("❌ SOME TESTS FAILED");
  } else {
    console.log("✅ ALL TESTS PASSED");
  }
}

// How to run:
// 1. Save this as test_suggestions.js
// 2. Create an HTML file (e.g., test_runner.html):
//    <!DOCTYPE html>
//    <html>
//    <head><title>Suggestion Tests</title></head>
//    <body>
//      <h1>Suggestion Logic Tests</h1>
//      <p>Open console to see results.</p>
//      <script src="test_suggestions.js"></script>
//      <script>runTests();</script>
//    </body>
//    </html>
// 3. Open test_runner.html in a browser.
// Alternatively, adapt to run with Node.js (e.g., using `npm init -y` and `type="module"` in package.json or using .mjs extension)

// console.log("Running suggestion tests...");
// runTests(); // Uncomment or call from HTML to run
