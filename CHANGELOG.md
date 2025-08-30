# Changelog

All notable changes to Zyeta DX will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-08-30

### 🔄 Restored
- Reverted to working state from commit b02af82
- Restored 2-table database structure (sessions + participants)
- Recovered complete quiz flow (/[code] → /[code]/quiz → /[code]/complete)
- Restored participant tracking with cookie-based authentication
- Recovered all working components (QuizContainer, CompletionScreen, etc.)

### 🧹 Removed
- Eliminated 30+ unused files
- Removed 5 unused directories (activities, architecture, plugins, realtime, services)
- Deleted duplicate components (6 files in shared folder)
- Removed unused Activity components (9 files)
- Deleted redundant utilities (6 files including duplicate analytics.ts)

### 📚 Added
- Created consolidated documentation structure
- Added VISION.md for strategic direction
- Added PRD.md with complete specifications
- Created TODO.md for rolling task management
- Added CHANGELOG.md for version tracking
- Created AGENTS.md for AI documentation

### 🔧 Fixed
- Build errors from missing components
- Import path inconsistencies
- Component export duplications
- Database schema issues

## [2.0.0] - 2025-08-29

### 💥 Breaking Changes
- Migrated to single-table database design (later reverted)
- Changed to 4-digit session codes (later reverted)
- Removed authentication system

### ✨ Added
- AI-powered insights with OpenAI integration
- Comprehensive documentation structure
- Memory system for context preservation
- Advanced analytics visualizations

## [1.5.0] - 2025-08-28

### ✨ Added
- Real-time updates via Server-Sent Events
- Generation-based analysis
- Workplace DNA visualization
- D3.js chart components

### 🔧 Improved
- Performance optimizations
- Mobile responsiveness
- Error handling

## [1.0.0] - 2025-08-15

### 🎉 Initial Release
- Core quiz functionality (7 questions)
- Session management with QR codes
- Basic analytics dashboard
- Participant tracking
- Preference scoring system
- No authentication required

---

## Versioning Guide

- **Major (X.0.0)**: Breaking changes, architecture updates
- **Minor (0.X.0)**: New features, significant improvements
- **Patch (0.0.X)**: Bug fixes, minor improvements

## Release Process

1. Update version in `package.json`
2. Update this CHANGELOG.md
3. Create git tag: `git tag -a v2.1.0 -m "Release v2.1.0"`
4. Push tags: `git push origin --tags`
5. Deploy to production

---

*For upcoming changes, see [TODO.md](./TODO.md)*