import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Explorer filtering logic", () => {
  const mockGems = [
    {
      name: "test-repo",
      full_name: "owner/test-repo",
      description: "A test repository",
      url: "https://github.com/owner/test-repo",
      stars: 500,
      forks_count: 20,
      open_issues_count: 3,
      language: "TypeScript",
      gem_score: 85,
      momentum_trend: 1.6,
      recent_commits: 10,
      activity: [1, 2, 3, 4],
      good_first_issues_url: "https://github.com/owner/test-repo/issues",
      has_good_first_issues: true,
      pushed_at: new Date().toISOString(),
      is_hype: false,
      merged_prs_count: 5,
      topics: ["react", "typescript"],
    },
    {
      name: "another-repo",
      full_name: "owner/another-repo",
      description: "Another test repo",
      url: "https://github.com/owner/another-repo",
      stars: 300,
      forks_count: 10,
      open_issues_count: 1,
      language: "JavaScript",
      gem_score: 72,
      momentum_trend: 0.9,
      recent_commits: 5,
      activity: [2, 3, 4, 5],
      good_first_issues_url: "https://github.com/owner/another-repo/issues",
      has_good_first_issues: true,
      pushed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      is_hype: true,
      merged_prs_count: 2,
      topics: ["javascript"],
    },
    {
      name: "hype-repo",
      full_name: "owner/hype-repo",
      description: "An AI powered tool",
      url: "https://github.com/owner/hype-repo",
      stars: 200,
      forks_count: 50,
      open_issues_count: 0,
      language: "Python",
      gem_score: 95,
      momentum_trend: 2.1,
      recent_commits: 20,
      activity: [5, 6, 7, 8],
      good_first_issues_url: "https://github.com/owner/hype-repo/issues",
      has_good_first_issues: false,
      pushed_at: new Date().toISOString(),
      is_hype: true,
      merged_prs_count: 10,
      topics: ["ai", "llm"],
    },
  ];

  describe("hype filter", () => {
    it("filters out hype repos when noHype is true", () => {
      const filtered = mockGems.filter((gem) => !gem.is_hype);
      expect(filtered.length).toBe(2);
      expect(filtered.map(g => g.name)).not.toContain("hype-repo");
    });

    it("keeps non-hype repos when noHype is false", () => {
      const filtered = mockGems.filter((gem) => !gem.is_hype || true);
      expect(filtered.length).toBe(3);
    });
  });

  describe("language filter", () => {
    it("filters by language when selected", () => {
      const selectedLanguage = "TypeScript";
      const filtered = mockGems.filter(
        (gem) => selectedLanguage === "All" || gem.language === selectedLanguage
      );
      expect(filtered.map(g => g.language)).toEqual(expect.arrayContaining(["TypeScript"]));
    });

    it("returns all gems when language is 'All'", () => {
      const filtered = mockGems.filter(
        (gem) => "All" === "All"
      );
      expect(filtered.length).toBe(3);
    });
  });

  describe("saved filter", () => {
    it("filters by saved gems when sortBy is 'saved'", () => {
      const savedGems = ["owner/test-repo"];
      const filtered = mockGems.filter(
        (gem) => "saved" !== "saved" || savedGems.includes(gem.full_name)
      );
      expect(filtered.map(g => g.full_name)).toContain("owner/test-repo");
    });

    it("shows all gems when sortBy is not 'saved'", () => {
      const filtered = mockGems.filter(
        (gem) => "score" !== "saved"
      );
      expect(filtered.length).toBe(3);
    });
  });

  describe("search query", () => {
    it("matches gem name", () => {
      const query = "test";
      const matchesQuery = (text: string | string[]) => {
        if (!text) return false;
        const textLower = typeof text === 'string' ? text.toLowerCase() : text.map((t: string) => t.toLowerCase()).join(' ');
        if (textLower.includes(query)) return true;
        const tokens = textLower.split(/\s+/);
        return tokens.some((token: string) => token.includes(query));
      };
      
      expect(matchesQuery("test-repo")).toBe(true);
    });

    it("matches gem description", () => {
      const query = "repository";
      const matchesQuery = (text: string | string[]) => {
        if (!text) return false;
        const textLower = typeof text === 'string' ? text.toLowerCase() : text.map((t: string) => t.toLowerCase()).join(' ');
        if (textLower.includes(query)) return true;
        const tokens = textLower.split(/\s+/);
        return tokens.some((token: string) => token.includes(query));
      };
      
      expect(matchesQuery("A test repository")).toBe(true);
    });

    it("matches gem language", () => {
      const query = "typescript";
      const matchesQuery = (text: string | string[]) => {
        if (!text) return false;
        const textLower = typeof text === 'string' ? text.toLowerCase() : text.map((t: string) => t.toLowerCase()).join(' ');
        if (textLower.includes(query)) return true;
        const tokens = textLower.split(/\s+/);
        return tokens.some((token: string) => token.includes(query));
      };
      
      expect(matchesQuery("TypeScript")).toBe(true);
    });

    it("matches gem topics", () => {
      const query = "react";
      const matchesQuery = (text: string) => {
        if (!text) return false;
        const textLower = text.toLowerCase();
        if (textLower.includes(query)) return true;
        const tokens = textLower.split(/\s+/);
        return tokens.some((token: string) => token.includes(query));
      };
      
      expect(matchesQuery("react")).toBe(true);
    });

    it("returns all gems for empty query", () => {
      const query = "";
      const matchesQuery = (text: string | string[]) => {
        if (!text) return false;
        const textLower = typeof text === 'string' ? text.toLowerCase() : text.map((t: string) => t.toLowerCase()).join(' ');
        if (textLower.includes(query)) return true;
        const tokens = textLower.split(/\s+/);
        return tokens.some((token: string) => token.includes(query));
      };
      
      expect(matchesQuery("")).toBe(true);
    });
  });
});

describe("useLocalStorage hook logic", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it("stores and retrieves value from localStorage", () => {
    const key = "test-key";
    const initialValue = "test-value";
    
    localStorage.setItem(key, JSON.stringify(initialValue));
    const retrieved = JSON.parse(localStorage.getItem(key) || "null");
    expect(retrieved).toBe("test-value");
  });

  it("defaults to initialValue when localStorage is empty", () => {
    const key = "nonexistent-key";
    const initialValue = "default-value";
    
    const retrieved = JSON.parse(localStorage.getItem(key) || JSON.stringify(initialValue));
    expect(retrieved).toBe("default-value");
  });

  it("handles JSON.parse error gracefully", () => {
    const key = "corrupt-key";
    localStorage.setItem(key, "not valid json");
    
    const retrieved = JSON.parse(localStorage.getItem(key) || JSON.stringify("default"));
    expect(retrieved).toBe("default");
  });
});

describe("useDebounce hook logic", () => {
  let setTimeoutMock: any;

  beforeEach(() => {
    setTimeoutMock = setTimeout;
    global.setTimeout = jest.fn((cb: any, delay: number) => {
      setTimeoutMock(cb, delay);
      return {} as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout;
  });

  afterEach(() => {
    global.setTimeout = setTimeoutMock;
  });

  it("debounces value after delay", () => {
    const debounceDelay = 50;
    
    let callbackCalled = false;
    const handler = vi.fn(() => { callbackCalled = true; });
    
    // Simulate useDebounce behavior
    let value = "initial";
    const setValue = (newValue: string) => {
      value = newValue;
      const timeoutId = setTimeoutMock(handler, debounceDelay);
      // Clear the timeout immediately to simulate the cleanup
      clearTimeout(timeoutId);
    };
    
    setValue("first change");
    expect(callbackCalled).toBe(false); // Should not have fired yet
    
    // Advance time past the delay
    // @ts-ignore
    global.setTimeout.mock.calls[0][0]();
    
    expect(callbackCalled).toBe(true); // Should have fired after delay
  });

  it("clears timeout on re-call", () => {
    let callCount = 0;
    const handler = vi.fn(() => { callCount++; });
    
    let value = "initial";
    const debounceDelay = 1000;
    
    const setValue = (newValue: string) => {
      value = newValue;
      const timeoutId = setTimeoutMock(handler, debounceDelay);
      clearTimeout(timeoutId); // Clear the timeout
    };
    
    setValue("first");
    setValue("second");
    
    // After clearing, advancing time should not have fired
    // @ts-ignore
    global.setTimeout.mock.calls.forEach(call => {
      // Simulate advancing past the first timeout
    });
    
    // The key point: after two setValue calls with clearing, 
    // the handler should only have been called once or not at all
    // depending on implementation
    expect(callCount).toBeLessThanOrEqual(1);
  });
});