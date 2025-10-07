/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Comprehensive test script for MCP tool calling functionality
 * Tests all three LLM providers: MetaGen API, Llama API, and Local MLX
 */

import path from "path";
import { runInCondaEnvironment } from "@xrpa/xrpa-orchestrator";

const { spawn } = require('child_process');

interface TestResult {
  success: boolean;
  output: string;
  error?: string;
}

async function runPythonTestInConda(scriptName: string): Promise<TestResult> {
  try {
    const apidir = path.join(__dirname, "..", "LlmHub");
    const scriptPath = path.join(apidir, scriptName);

    console.log(`Running ${scriptName} in conda environment...`);

    // Use the same conda environment setup as MetaGenStandalone
    await runInCondaEnvironment(
      path.join(apidir, "environment.yaml"),
      scriptPath,
    );

    return {
      success: true,
      output: `Successfully ran ${scriptName} in conda environment`,
    };
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Keep the old function as fallback for non-conda testing
async function runPythonTest(scriptName: string): Promise<TestResult> {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, '..', 'LlmHub', scriptName);
    const pythonProcess = spawn('python3', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.dirname(scriptPath),
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      output += text;
      console.log(text);
    });

    pythonProcess.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      errorOutput += text;
      console.error(text);
    });

    pythonProcess.on('close', (code: number | null) => {
      resolve({
        success: code === 0,
        output,
        error: errorOutput || undefined,
      });
    });

    pythonProcess.on('error', (error: Error) => {
      resolve({
        success: false,
        output,
        error: error.message,
      });
    });
  });
}

async function testMcpToolCalling(): Promise<void> {
  console.log('🧪 MCP Tool Calling Comprehensive Test Suite');
  console.log('='.repeat(60));
  console.log('Testing all three LLM providers:');
  console.log('  • MetaGen API (with MCP tool calling)');
  console.log('  • Llama API (with MCP tool calling)');
  console.log('  • Local MLX LLM (with MCP tool calling)');
  console.log('='.repeat(60));

  try {
    // Run the comprehensive test suite in conda environment
    console.log('\n🔄 Running comprehensive MCP tool calling tests in conda environment...');
    const testResult = await runPythonTestInConda('test_comprehensive.py');

    if (testResult.success) {
      console.log('\n✅ All MCP tool calling tests completed successfully!');
      console.log('   All three LLM providers support tool calling via MCP');
    } else {
      console.log('\n❌ Some MCP tool calling tests failed');
      if (testResult.error) {
        console.error('Error details:', testResult.error);
      }
    }

  } catch (error) {
    console.error('❌ Test suite execution failed:', error);
  }

  // Print manual testing instructions
  printManualTestInstructions();
}

function printManualTestInstructions(): void {
  console.log('\n📋 Manual Testing Instructions');
  console.log('='.repeat(40));
  console.log('');
  console.log('🚀 Quick Start:');
  console.log('  1. yarn test-mcp-tools    # Run all automated tests');
  console.log('  2. cd LlmHub && python3 example_mcp_server.py    # Start test server');
  console.log('  3. cd LlmHub && python3 main.py    # Start MetaGen with MCP support');
  console.log('');
  console.log('🔧 Setup for Real Testing:');
  console.log('');
  console.log('  A. MetaGen API Testing:');
  console.log('     export METAGEN_ACCESS_TOKEN=your_token');
  console.log('     # Test with prompts like "Calculate 15 + 23"');
  console.log('');
  console.log('  B. Llama API Testing:');
  console.log('     export LLAMA_API_KEY=your_key');
  console.log('     # Test with math questions and tool requests');
  console.log('');
  console.log('  C. Local MLX Testing:');
  console.log('     # Ensure MLX is installed: pip install mlx-lm');
  console.log('     # Test with smaller models for faster inference');
  console.log('');
  console.log('📊 Expected Behavior:');
  console.log('  ✅ LLM detects available MCP tools');
  console.log('  ✅ LLM generates proper tool call JSON');
  console.log('  ✅ MCP tools are executed successfully');
  console.log('  ✅ Tool results are incorporated into responses');
  console.log('  ✅ Conversation continues naturally after tool use');
  console.log('');
  console.log('🐛 Debugging:');
  console.log('  • Check console logs for MCP connection status');
  console.log('  • Verify tool call JSON format in responses');
  console.log('  • Monitor tool execution results and errors');
  console.log('  • Test with different model sizes and providers');
  console.log('');
}

// Main execution
async function main(): Promise<void> {
  await testMcpToolCalling();
}

if (require.main === module) {
  main().catch(console.error);
}

export { testMcpToolCalling, runPythonTest };
