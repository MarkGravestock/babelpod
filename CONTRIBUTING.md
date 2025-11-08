# Contributing to BabelPod

## Development Workflow

### Before Starting Any Work

1. **Always start from main branch**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create a new branch from main**
   ```bash
   git checkout -b feature/your-feature-name
   ```

   Branch naming convention:
   - `feature/` - for new features
   - `fix/` - for bug fixes
   - `refactor/` - for code refactoring
   - `docs/` - for documentation updates

### Development Process

1. **Make your changes**
   - Write code following the existing code style
   - Add tests for new functionality
   - Update documentation if needed

2. **Run linter**
   ```bash
   npm run lint
   ```
   Code must pass linting with no errors before submitting a PR.

3. **Run tests locally**
   ```bash
   npm test
   ```
   All tests must pass before submitting a PR.

4. **Run the build**
   ```bash
   npm run build
   ```
   The build must complete successfully without errors.

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "Clear, descriptive commit message"
   ```

   Commit message format:
   - Use present tense ("Add feature" not "Added feature")
   - Be descriptive but concise
   - Reference issue numbers if applicable

### Before Creating a Pull Request

**Required Checklist:**

- [ ] Branch was created from latest `main`
- [ ] Code passes linting with no errors (`npm run lint`)
- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Code follows existing style and conventions
- [ ] New features have tests
- [ ] Documentation is updated if needed
- [ ] No console errors or warnings in browser
- [ ] Self-hosted Whisper functionality tested (if applicable)

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push -u origin your-branch-name
   ```

2. **Create PR on GitHub**
   - Provide a clear title and description
   - Link related issues
   - Add screenshots/videos for UI changes
   - Wait for review

### Testing

#### Run Linter
```bash
npm run lint
```
Checks for code style and potential errors. Must pass with 0 errors before opening a PR.

#### Run All Tests
```bash
npm test
```

#### Run Specific Test File
```bash
npm test path/to/test/file.test.js
```

#### Run Tests in Watch Mode
```bash
npm test -- --watch
```

#### Run Full Pre-PR Check
```bash
npm run lint && npm test && npm run build
```
This runs all checks that GitHub Actions will run.

### Common Issues

#### "HTMLMediaElement already connected" Error
This error occurs when trying to create multiple MediaElementSource nodes from the same audio element. The solution is to use a temporary audio element for each Web Audio API operation.

#### CORS Errors
Ensure the nginx CORS proxy is running when using self-hosted Whisper:
```bash
docker-compose up -d
```

#### Tests Failing
1. Ensure you're on latest main: `git pull origin main`
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Clear test cache: `npm test -- --clearCache`

### Code Review Guidelines

- Be respectful and constructive
- Focus on the code, not the person
- Explain why changes are needed
- Suggest alternatives when possible

## Questions?

If you have questions about the development process, please open an issue or ask in discussions.
