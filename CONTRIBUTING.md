# Contributing to LaptopGuru

We love your input! We want to make contributing to LaptopGuru as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using GitHub's [issue tracker](https://github.com/yourusername/laptop-comparison/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/yourusername/laptop-comparison/issues/new); it's that easy!

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Git

### Setup Steps

1. Clone your fork: `git clone https://github.com/yourusername/laptop-comparison.git`
2. Install dependencies: `npm install` (in root, client, and server directories)
3. Set up environment variables (see .env.example files)
4. Start development servers: `npm run dev`

### Code Style

- Use TypeScript for all new JavaScript code
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure responsive design for UI components

### Commit Messages

- Use clear and meaningful commit messages
- Start with a verb (Add, Fix, Update, Remove, etc.)
- Reference issue numbers when applicable

Example:

```
Add laptop filtering by screen size
Fix: Resolve TypeScript errors in compare service
Update: Improve chatbot response accuracy
```

### Testing

- Test your changes in both development and production builds
- Verify responsive design on different screen sizes
- Ensure accessibility standards are met

## Feature Requests

We welcome feature requests! Please provide:

- Clear description of the feature
- Use case or problem it solves
- Possible implementation approach
- Any examples or mockups

## Code Review Process

The core team looks at Pull Requests on a regular basis. After feedback has been given we expect responses within two weeks. After two weeks we may close the pull request if it isn't showing any activity.

## Community and Behavioral Expectations

We want this to be a fun, pleasant, and harassment-free experience for everyone. Please be respectful and constructive in all interactions.

## License

By contributing, you agree that your contributions will be licensed under its MIT License.

## Questions?

Feel free to open an issue or contact the maintainers if you have any questions about contributing.
