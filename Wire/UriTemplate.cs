﻿using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;

namespace Wire
{
    public class UriTemplate
    {
        private static Dictionary<char, OperatorInfo> _Operators = new Dictionary<char, OperatorInfo>() {
            {'\0', new OperatorInfo {Default = true, First = "", Seperator = ',', Named = false, IfEmpty = "",AllowReserved = false}},
            {'+', new OperatorInfo {Default = false, First = "", Seperator = ',', Named = false, IfEmpty = "",AllowReserved = true}},
            {'.', new OperatorInfo {Default = false, First = ".", Seperator = '.', Named = false, IfEmpty = "",AllowReserved = false}},
            {'/', new OperatorInfo {Default = false, First = "/", Seperator = '/', Named = false, IfEmpty = "",AllowReserved = false}},
            {';', new OperatorInfo {Default = false, First = ";", Seperator = ';', Named = true, IfEmpty = "",AllowReserved = false}},
            {'?', new OperatorInfo {Default = false, First = "?", Seperator = '&', Named = true, IfEmpty = "=",AllowReserved = false}},
            {'&', new OperatorInfo {Default = false, First = "&", Seperator = '&', Named = true, IfEmpty = "=",AllowReserved = false}},
            {'#', new OperatorInfo {Default = false, First = "#", Seperator = ',', Named = false, IfEmpty = "",AllowReserved = true}}
        };

        private readonly string _template;
        private readonly Dictionary<string, object> _Parameters;
        private enum States { CopyingLiterals, ParsingExpression }


        private readonly bool _resolvePartially;

        public UriTemplate(string template, bool resolvePartially = false, bool caseInsensitiveParameterNames = false)
        {
            _resolvePartially = resolvePartially;
            _template = template;
            _Parameters = caseInsensitiveParameterNames
                ? new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase)
                : new Dictionary<string, object>();
        }

        public override string ToString() => _template;
        public void SetParameter(string name, object value) => _Parameters[name] = value;
        public void ClearParameter(string name) => _Parameters.Remove(name);
        public void SetParameter(string name, string value) => _Parameters[name] = value;
        public void SetParameter(string name, IEnumerable<string> value) => _Parameters[name] = value;
        public void SetParameter(string name, IDictionary<string, string> value) => _Parameters[name] = value;
        public IEnumerable<string> GetParameterNames() => ResolveResult().ParameterNames;
        public string Resolve() => ResolveResult().ToString();

        private Result ResolveResult()
        {
            var currentState = States.CopyingLiterals;
            var result = new Result();
            StringBuilder currentExpression = null;
            foreach (var character in _template.ToCharArray())
            {
                switch (currentState)
                {
                    case States.CopyingLiterals:
                        if (character == '{')
                        {
                            currentState = States.ParsingExpression;
                            currentExpression = new StringBuilder();
                        }
                        else if (character == '}')
                        {
                            throw new ArgumentException("Malformed template, unexpected } : " + result.ToString());
                        }
                        else
                        {
                            result.Append(character);
                        }
                        break;
                    case States.ParsingExpression:
                        if (character == '}')
                        {
                            ProcessExpression(currentExpression, result);

                            currentState = States.CopyingLiterals;
                        }
                        else
                        {
                            currentExpression.Append(character);
                        }

                        break;
                }
            }
            if (currentState == States.ParsingExpression)
            {
                result.Append("{");
                result.Append(currentExpression.ToString());

                throw new ArgumentException("Malformed template, missing } : " + result.ToString());
            }

            if (result.ErrorDetected)
            {
                throw new ArgumentException("Malformed template : " + result.ToString());
            }
            return result;
        }

        private void ProcessExpression(StringBuilder currentExpression, Result result)
        {

            if (currentExpression.Length == 0)
            {
                result.ErrorDetected = true;
                result.Append("{}");
                return;
            }

            OperatorInfo op = GetOperator(currentExpression[0]);

            var firstChar = op.Default ? 0 : 1;
            bool multivariableExpression = false;

            var varSpec = new VarSpec(op);
            for (int i = firstChar; i < currentExpression.Length; i++)
            {
                char currentChar = currentExpression[i];
                switch (currentChar)
                {
                    case '*':
                        varSpec.Explode = true;
                        break;

                    case ':':  // Parse Prefix Modifier
                        var prefixText = new StringBuilder();
                        currentChar = currentExpression[++i];
                        while (currentChar >= '0' && currentChar <= '9' && i < currentExpression.Length)
                        {
                            prefixText.Append(currentChar);
                            i++;
                            if (i < currentExpression.Length) currentChar = currentExpression[i];
                        }
                        varSpec.PrefixLength = int.Parse(prefixText.ToString());
                        i--;
                        break;

                    case ',':
                        multivariableExpression = true;
                        var success = ProcessVariable(varSpec, result, multivariableExpression);
                        bool isFirst = varSpec.First;
                        // Reset for new variable
                        varSpec = new VarSpec(op);
                        if (success || !isFirst || _resolvePartially) varSpec.First = false;
                        if (!success && _resolvePartially) { result.Append(","); }
                        break;


                    default:
                        if (IsVarNameChar(currentChar))
                        {
                            varSpec.VarName.Append(currentChar);
                        }
                        else
                        {
                            result.ErrorDetected = true;
                        }
                        break;
                }
            }

            ProcessVariable(varSpec, result, multivariableExpression);
            if (multivariableExpression && _resolvePartially) result.Append("}");
        }

        private bool ProcessVariable(VarSpec varSpec, Result result, bool multiVariableExpression = false)
        {
            var varname = varSpec.VarName.ToString();
            result.ParameterNames.Add(varname);

            if (!_Parameters.ContainsKey(varname)
                || _Parameters[varname] == null
                || (_Parameters[varname] is IList && ((IList)_Parameters[varname]).Count == 0)
                || (_Parameters[varname] is IDictionary && ((IDictionary)_Parameters[varname]).Count == 0))
            {
                if (_resolvePartially == true)
                {
                    if (multiVariableExpression)
                    {
                        if (varSpec.First)
                        {
                            result.Append("{");
                        }

                        result.Append(varSpec.ToString());
                    }
                    else
                    {
                        result.Append("{");
                        result.Append(varSpec.ToString());
                        result.Append("}");
                    }
                    return false;
                }
                return false;
            }

            if (varSpec.First)
            {
                result.Append(varSpec.OperatorInfo.First);
            }
            else
            {
                result.Append(varSpec.OperatorInfo.Seperator);
            }

            object value = _Parameters[varname];

            // Handle Strings
            if (value is string)
            {
                var stringValue = (string)value;
                if (varSpec.OperatorInfo.Named)
                {
                    result.AppendName(varname, varSpec.OperatorInfo, string.IsNullOrEmpty(stringValue));
                }
                result.AppendValue(stringValue, varSpec.PrefixLength, varSpec.OperatorInfo.AllowReserved);
            }
            else
            {
                // Handle Lists
                var list = value as IList;
                if (list == null && value is IEnumerable<string>)
                {
                    list = ((IEnumerable<string>)value).ToList<string>();
                };
                if (list != null)
                {
                    if (varSpec.OperatorInfo.Named && !varSpec.Explode)  // exploding will prefix with list name
                    {
                        result.AppendName(varname, varSpec.OperatorInfo, list.Count == 0);
                    }

                    result.AppendList(varSpec.OperatorInfo, varSpec.Explode, varname, list);
                }
                else
                {
                    // Handle associative arrays
                    var dictionary = value as IDictionary<string, string>;
                    if (dictionary != null)
                    {
                        if (varSpec.OperatorInfo.Named && !varSpec.Explode)  // exploding will prefix with list name
                        {
                            result.AppendName(varname, varSpec.OperatorInfo, dictionary.Count() == 0);
                        }
                        result.AppendDictionary(varSpec.OperatorInfo, varSpec.Explode, dictionary);
                    }
                    else
                    {
                        // If above all fails, convert the object to string using the default object.ToString() implementation
                        var stringValue = value.ToString();
                        if (varSpec.OperatorInfo.Named)
                        {
                            result.AppendName(varname, varSpec.OperatorInfo, string.IsNullOrEmpty(stringValue));
                        }
                        result.AppendValue(stringValue, varSpec.PrefixLength, varSpec.OperatorInfo.AllowReserved);
                    }
                }
            }
            return true;
        }

        private static bool IsVarNameChar(char c)
        {
            return ((c >= 'A' && c <= 'z') //Alpha
                    || (c >= '0' && c <= '9') // Digit
                    || c == '_'
                    || c == '%'
                    || c == '.');
        }

        private static OperatorInfo GetOperator(char operatorIndicator)
        {
            OperatorInfo op;
            switch (operatorIndicator)
            {

                case '+':
                case ';':
                case '/':
                case '#':
                case '&':
                case '?':
                case '.':
                    op = _Operators[operatorIndicator];
                    break;

                default:
                    op = _Operators['\0'];
                    break;
            }
            return op;
        }

        private const string varname = "[a-zA-Z0-9_]*";
        private const string op = "(?<op>[+#./;?&]?)";
        private const string var = "(?<var>(?:(?<lvar>" + varname + ")[*]?,?)*)";
        private const string varspec = "(?<varspec>{" + op + var + "})";

        // (?<varspec>{(?<op>[+#./;?&]?)(?<var>[a-zA-Z0-9_]*[*]?|(?:(?<lvar>[a-zA-Z0-9_]*[*]?),?)*)})

        private Regex _ParameterRegex = null;

        public IDictionary<string, object> GetParameters(Uri uri)
        {
            if (_ParameterRegex == null)
            {
                var matchingRegex = CreateMatchingRegex(_template);
                lock (this)
                {
                    _ParameterRegex = new Regex(matchingRegex);
                }
            }

            var match = _ParameterRegex.Match(uri.OriginalString);
            var parameters = new Dictionary<string, object>();

            for (int x = 1; x < match.Groups.Count; x++)
            {
                if (match.Groups[x].Success)
                {
                    var paramName = _ParameterRegex.GroupNameFromNumber(x);
                    if (!string.IsNullOrEmpty(paramName))
                    {
                        parameters.Add(paramName, Uri.UnescapeDataString(match.Groups[x].Value));
                    }

                }
            }
            return match.Success ? parameters : null;
        }

        public static string CreateMatchingRegex(string uriTemplate)
        {
            var findParam = new Regex(varspec);
            var template = new Regex(@"([^{]|^)\?").Replace(uriTemplate, @"$+\?"); ;//.Replace("?",@"\?");
            var regex = findParam.Replace(template, delegate (Match m)
            {
                var paramNames = m.Groups["lvar"].Captures.Cast<Capture>().Where(c => !string.IsNullOrEmpty(c.Value)).Select(c => c.Value).ToList();
                var op = m.Groups["op"].Value;
                switch (op)
                {
                    case "?":
                        return GetQueryExpression(paramNames, prefix: "?");
                    case "&":
                        return GetQueryExpression(paramNames, prefix: "&");
                    case "#":
                        return GetExpression(paramNames, prefix: "#");
                    case "/":
                        return GetExpression(paramNames, prefix: "/");

                    case "+":
                        return GetExpression(paramNames);
                    default:
                        return GetExpression(paramNames);
                }
            });
            return regex + "$";
        }

        public static string CreateMatchingRegex2(string uriTemplate)
        {
            var findParam = new Regex(varspec);
            //split by host/path/query/fragment
            var template = new Regex(@"([^{]|^)\?").Replace(uriTemplate, @"$+\?"); ;//.Replace("?",@"\?");
            var regex = findParam.Replace(template, delegate (Match m)
            {
                var paramNames = m.Groups["lvar"].Captures.Cast<Capture>().Where(c => !string.IsNullOrEmpty(c.Value)).Select(c => c.Value).ToList();
                var op = m.Groups["op"].Value;
                switch (op)
                {
                    case "?":
                        return GetQueryExpression(paramNames, prefix: "?");
                    case "&":
                        return GetQueryExpression(paramNames, prefix: "&");
                    case "#":
                        return GetExpression(paramNames, prefix: "#");
                    case "/":
                        return GetExpression(paramNames, prefix: "/");

                    case "+":
                        return GetExpression(paramNames);
                    default:
                        return GetExpression(paramNames);
                }
            });
            return regex + "$";
        }

        private static string GetQueryExpression(List<String> paramNames, string prefix)
        {
            StringBuilder sb = new StringBuilder();
            foreach (var paramname in paramNames)
            {

                sb.Append(@"\" + prefix + "?");
                if (prefix == "?") prefix = "&";

                sb.Append("(?:");
                sb.Append(paramname);
                sb.Append("=");

                sb.Append("(?<");
                sb.Append(paramname);
                sb.Append(">");
                sb.Append("[^/?&]+");
                sb.Append(")");
                sb.Append(")?");
            }
            return sb.ToString();
        }

        private static string GetExpression(List<String> paramNames, string prefix = null)
        {
            StringBuilder sb = new StringBuilder();

            string paramDelim;

            switch (prefix)
            {
                case "#":
                    paramDelim = "[^,]+";
                    break;
                case "/":
                    paramDelim = "[^/?]+";
                    break;
                case "?":
                case "&":
                    paramDelim = "[^&#]+";
                    break;
                case ";":
                    paramDelim = "[^;/?#]+";
                    break;
                case ".":
                    paramDelim = "[^./?#]+";
                    break;
                default:
                    paramDelim = "[^/?&]+";
                    break;
            }

            foreach (var paramname in paramNames)
            {
                if (string.IsNullOrEmpty(paramname)) continue;

                if (prefix != null)
                {
                    sb.Append(@"\" + prefix + "?");
                    if (prefix == "#") { prefix = ","; }
                }
                sb.Append("(?<");
                sb.Append(paramname);
                sb.Append(">");
                sb.Append(paramDelim); // Param Value
                sb.Append(")?");
            }
            return sb.ToString();
        }
    }

    public class OperatorInfo
    {
        public bool Default { get; set; }
        public string First { get; set; }
        public char Seperator { get; set; }
        public bool Named { get; set; }
        public string IfEmpty { get; set; }
        public bool AllowReserved { get; set; }
    }

    public class Result
    {
        public bool ErrorDetected { get; set; }
        public List<string> ParameterNames { get; set; }
        private const string _UriReservedSymbols = ":/?#[]@!$&'()*+,;=";
        private const string _UriUnreservedSymbols = "-._~";

        private StringBuilder _Result = new StringBuilder();

        public Result()
        {
            ParameterNames = new List<string>();
        }

        public StringBuilder Append(char value) => _Result.Append(value);
        public StringBuilder Append(string value) => _Result.Append(value);
        public override string ToString() => _Result.ToString();

        public void AppendName(string variable, OperatorInfo op, bool valueIsEmpty)
        {
            _Result.Append(variable);
            if (valueIsEmpty) {
                _Result.Append(op.IfEmpty);
            } else {
                _Result.Append("=");
            }
        }

        public void AppendList(OperatorInfo op, bool explode, string variable, IList list)
        {
            foreach (object item in list)
            {
                if (op.Named && explode)
                {
                    _Result.Append(variable);
                    _Result.Append("=");
                }
                AppendValue(item.ToString(), 0, op.AllowReserved);

                _Result.Append(explode ? op.Seperator : ',');
            }
            if (list.Count > 0)
            {
                _Result.Remove(_Result.Length - 1, 1);
            }
        }

        public void AppendDictionary(OperatorInfo op, bool explode, IDictionary<string, string> dictionary)
        {
            foreach (string key in dictionary.Keys)
            {
                _Result.Append(Encode(key, op.AllowReserved));
                if (explode) _Result.Append('='); else _Result.Append(',');
                AppendValue(dictionary[key], 0, op.AllowReserved);

                if (explode)
                {
                    _Result.Append(op.Seperator);
                }
                else
                {
                    _Result.Append(',');
                }
            }
            if (dictionary.Count() > 0)
            {
                _Result.Remove(_Result.Length - 1, 1);
            }
        }

        public void AppendValue(string value, int prefixLength, bool allowReserved)
        {
            if (prefixLength != 0)
            {
                if (prefixLength < value.Length)
                {
                    value = value.Substring(0, prefixLength);
                }
            }
            _Result.Append(Encode(value, allowReserved));
        }

        private static string Encode(string p, bool allowReserved)
        {
            var result = new StringBuilder();
            foreach (char c in p)
            {
                if ((c >= 'A' && c <= 'z')   //Alpha
                    || (c >= '0' && c <= '9')  // Digit
                    || _UriUnreservedSymbols.IndexOf(c) != -1  // Unreserved symbols  - These should never be percent encoded
                    || (allowReserved && _UriReservedSymbols.IndexOf(c) != -1))  // Reserved symbols - should be included if requested (+)
                {
                    result.Append(c);
                } else {
                    var bytes = Encoding.UTF8.GetBytes(new[] { c });
                    foreach (var abyte in bytes)
                    {
                        result.Append(HexEscape(abyte));
                    }
                }
            }
            return result.ToString();
        }

        public static string HexEscape(byte i)
        {
            var esc = new char[3];
            esc[0] = '%';
            esc[1] = HexDigits[((i & 240) >> 4)];
            esc[2] = HexDigits[(i & 15)];
            return new string(esc);
        }

        public static string HexEscape(char c)
        {
            var esc = new char[3];
            esc[0] = '%';
            esc[1] = HexDigits[(((int)c & 240) >> 4)];
            esc[2] = HexDigits[((int)c & 15)];
            return new string(esc);
        }

        private static readonly char[] HexDigits = new char[] { '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F' };
    }

    public static class UriTemplateExtensions
    {
        public static UriTemplate AddParameter(this UriTemplate template, string name, object value)
        {
            template.SetParameter(name, value);
            return template;
        }

        public static UriTemplate AddParameters(this UriTemplate template, object parametersObject)
        {
            if (parametersObject != null)
            {
                IEnumerable<PropertyInfo> properties;
#if DOTNET5_1
                var type = parametersObject.GetType().GetTypeInfo();
                properties = type.DeclaredProperties.Where(p=> p.CanRead);
#else
                properties = parametersObject.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance);
#endif
                foreach (var propinfo in properties) {
                    template.SetParameter(propinfo.Name, propinfo.GetValue(parametersObject, null));
                }
            }
            return template;
        }

        public static UriTemplate AddParameters(this UriTemplate uriTemplate, IDictionary<string, object> linkParameters)
        {
            if (linkParameters != null) {
                foreach (var parameter in linkParameters) {
                    uriTemplate.SetParameter(parameter.Key, parameter.Value);
                }
            }
            return uriTemplate;
        }
    }

    public static class UriExtensions
    {
        public static UriTemplate MakeTemplate(this Uri uri)
        {
            var parameters = uri.GetQueryStringParameters();
            return MakeTemplate(uri, parameters);
        }

        public static UriTemplate MakeTemplate(this Uri uri, IDictionary<string, object> parameters)
        {
            var target = uri.GetComponents(UriComponents.AbsoluteUri
                                                     & ~UriComponents.Query
                                                     & ~UriComponents.Fragment, UriFormat.Unescaped);
            var template = new UriTemplate(target + "{?" + string.Join(",", parameters.Keys.ToArray()) + "}");
            template.AddParameters(parameters);
            return template;
        }

        public static Dictionary<string, object> GetQueryStringParameters(this Uri target)
        {
            Uri uri = target;
            var parameters = new Dictionary<string, object>();
            var reg = new Regex(@"([-A-Za-z0-9._~]*)=([^&]*)&?");		// Unreserved characters: http://tools.ietf.org/html/rfc3986#section-2.3
            foreach (Match m in reg.Matches(uri.Query))
            {
                string key = m.Groups[1].Value.ToLowerInvariant();
                string value = m.Groups[2].Value;
                parameters.Add(key, value);
            }
            return parameters;
        }
    }

    public class TemplateMatch
    {
        public string Key { get; set; }
        public UriTemplate Template { get; set; }
        public IDictionary<string, object> Parameters { get; set; }
    }

    public class VarSpec
    {
        private readonly OperatorInfo _operatorInfo;
        public StringBuilder VarName = new StringBuilder();
        public bool Explode = false;
        public int PrefixLength = 0;
        public bool First = true;

        public VarSpec(OperatorInfo operatorInfo)
        {
            _operatorInfo = operatorInfo;
        }

        public OperatorInfo OperatorInfo { get { return _operatorInfo; } }

        public override string ToString()
        {
            return (First ? _operatorInfo.First : "") +
                   VarName.ToString()
                   + (Explode ? "*" : "")
                   + (PrefixLength > 0 ? ":" + PrefixLength : "");

        }
    }
}
